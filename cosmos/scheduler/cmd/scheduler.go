package scheduler

import (
	"context"
	"log"
	"time"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"

	"github.com/scality/zenko/cosmos/api/types/v1alpha1"
	clientV1alpha1 "github.com/scality/zenko/cosmos/clientset/v1alpha1"
	"github.com/scality/zenko/cosmos/scheduler/pkg"
	"k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)
const (
	nfsLocation = "location-nfs-mount-v1"
)

// Scheduler represents a Cosmos Scheduler instance
type Scheduler struct {
	KubeAlpha         *clientV1alpha1.ExampleV1Alpha1Client
	KubeClientset     *kubernetes.Clientset
	Pensieve          *pensieve.Helper
	Database          string
	Namespace         string
	NodeCount         string
	Cloudserver       string
	StorageClass      string
	MongodbClient     *mongo.Client
	SecretName        string
	IngestionSchedule string
}

// BucketTransaction is used as the decoded element returned by MongoDB
type BucketTransaction struct {
	LocationType  string
	OperationType string `bson:"operationType"`
	FullDocument  struct {
		Value struct {
			Name               string `bson:"name"`
			OwnerDisplayName   string `bson:"ownerDisplayName"`
			Deleted            bool   `bson:"deleted"`
			LocationConstraint string `bson:"locationConstraint"`
		} `bson:"value"`
	} `bson:"fullDocument"`
}

// Run starts the Cosmos Scheduler
func (s *Scheduler) Run() {
	log.Println("starting cosmos scheduler")
	go s.healthCheckServer()

	// safely create or update secret on startup
	err := s.configureIngestionSecret(true)
	if err != nil{
		log.Fatal("run failed configuring secret: ", err)
	}

	overlayUpdates := s.watchOverlayUpdates(context.Background())
	bucketCh := s.watchBucketUpdates(context.Background())
	for {
		select {
		case bucket := <-bucketCh:
			s.applyChanges(&bucket)
		case <-overlayUpdates:
			log.Println("received an overlay update")
			// check for any credential updates
			s.configureIngestionSecret(false)
		}
	}
}

// healthCheckServer will ping the MongoDB connection on every request recieved
// at :8080/healthcheck
func (s *Scheduler) healthCheckServer() {
	health := func(w http.ResponseWriter, req *http.Request){
		ctx, cancel := context.WithTimeout(req.Context(), 5*time.Second)
		defer cancel()
		err := s.MongodbClient.Ping(ctx, readpref.Primary())
		if err != nil {
			log.Println("MongoDB healthcheck failed:", err)
			http.Error(w, "Internal error, could not contact MongoDB", 500)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
	http.HandleFunc("/healthcheck", health)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Checks for existing secret and creates one if non existant. If the a configmap
// exists but does not match the credentials in MongoDB then the secret will be updated.
// The init bool is used for start up sequences otherwise logging becomes too verbose.
func (s *Scheduler) configureIngestionSecret(init bool) error {
	accessKey, secretKey, err := s.Pensieve.GetServiceAccountCredentials("md-ingestion")
	if err != nil {
		log.Println("error getting service account credentials")
		return err
	}
	secret := s.getIngestionSecret()
	if secret == nil {
		log.Println("creating ingestion secret")
		err = s.setIngestionSecret(accessKey, secretKey, false)
		if err != nil {
			log.Println("error creating ingestion secret", err)
			return err
		}
		log.Println("ingestion secret created successfully")
	} else if string(secret["accessKey"]) != accessKey || string(secret["secretKey"]) != secretKey {
		log.Println("ingestion credentials changed, updating secret")
		err = s.setIngestionSecret(accessKey, secretKey, true)
		if err != nil {
			log.Println("error updating ingestion secret")
			return err
		} 
		log.Println("ingestion credentials successfully patched")
	} else if init {
		log.Println("found a valid ingestion secret")
	}
	return nil
}

// watchBucketUpdates will watch for any new "mirror mode" buckets created in the "__metastore".
// A new bucket created in a supported BucketTransaction.LocationType will send the transaction
// on the returned channel.
func (s *Scheduler) watchBucketUpdates(ctx context.Context) (chan BucketTransaction) {
	ch := make(chan BucketTransaction)
	go func() {
		collection := s.MongodbClient.Database(s.Database).Collection("__metastore")
		watch, cancel := context.WithCancel(ctx)
		defer cancel()
		cur, err := collection.Watch(watch, mongo.Pipeline{
			{{"$match", bson.D{
				{"fullDocument.value.ingestion.status", "enabled"},
			}}},
			{{"$project", bson.D{
				{"operationType", 1},
				{"fullDocument.value.ownerDisplayName", 1},
				{"fullDocument.value.name", 1},
				{"fullDocument.value.locationConstraint", 1},
				{"fullDocument.value.deleted", 1},
			}}},
		})
		defer cur.Close(watch)
		if err != nil {
			log.Fatal("error watching buckets", err)
		}
		log.Println("watching for bucket changes")
		for cur.Next(watch) {
			var elem BucketTransaction
			if err := cur.Decode(&elem); err != nil {
				log.Fatal("error decoding bucket", err)
			}
			// check if the bucket change is in a supported cosmos location
			if s.isCosmosLocation(&elem) {
				ch <- elem
			}
		}
		if err := cur.Err(); err != nil {
			log.Fatal("cursor error watching buckets: ", err)
		}
	}()
	return ch
}

// watchOverlayUpdates watches for any new configuration overlays inserted into the
// 'PENSIEVE' collection. It returns a channel interface that will send on every
// new overlay update recieved.
func (s *Scheduler) watchOverlayUpdates(ctx context.Context) (chan interface{}) {
	ch := make(chan interface{})
	go func() {
		collection := s.Pensieve.GetCollection()
		watch, cancel := context.WithCancel(ctx)
		defer cancel()
		cur, err := collection.Watch(watch,
			mongo.Pipeline{
				{{"$match", bson.D{
					{"fullDocument._id", primitive.Regex{
						Pattern: "configuration/overlay/",
						Options: "m",
					}},
				}}},
			}, options.ChangeStream())
		defer cur.Close(watch)
		if err != nil {
			log.Fatal("error watching overlays: ", err)
		}

		log.Println("waiting for overlay updates")
		// cur.Next is a blocking operation
		for cur.Next(watch) {
			ch <- "overlay update"
		}
		if err := cur.Err(); err != nil {
			log.Fatal("cursor error watching overlay updates: ", err)
		}
	}()
	return ch
}

// getIngestionSecret returns a key value map with 'accessKey' and 'secretKey'.
// The keys are strings and the values are byte arrays.
func (s *Scheduler) getIngestionSecret() (map[string][]byte) {
	secrets, err := s.KubeClientset.CoreV1().
		Secrets(s.Namespace).Get(s.SecretName, metav1.GetOptions{})
	if err != nil {
		return nil
	}
	if len(secrets.Data) > 0 {
		return secrets.Data
	}
	return nil
}

// setIngestionSecret creates or updates a Kubernetes secret from arguments accessKey and secretKey.
// The bool argument can be used to patch an existing secret.
func (s *Scheduler) setIngestionSecret(accessKey string, secretKey string, patch bool) error {
	kubeSecret := &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      s.SecretName,
			Namespace: s.Namespace,
			Labels: map[string]string{
				"ingestionCredentials": "true",
			},
		},
		Type: "Opaque",
		Data: map[string][]byte{
			"accessKey": []byte(accessKey),
			"secretKey": []byte(secretKey),
		},
	}
	if patch {
		_, err := s.KubeClientset.CoreV1().Secrets(s.Namespace).Update(kubeSecret)
		if err != nil {
			log.Println("error updating secret", err)
			return err
		}
	} else {
		_, err := s.KubeClientset.CoreV1().Secrets(s.Namespace).Create(kubeSecret)
		if err != nil {
			log.Println("error creating secret", err)
			return err
		}
	}
	return nil
}


// isCosmosLocation checks if a given BucketTransaction is in a supported
// Cosmos location type. This will also set the LocationType property of 
// the BucketTransaction based off the location.LocationType. BucketTransaction
// is expected to be not nil.
func (s *Scheduler) isCosmosLocation(bucket *BucketTransaction) (bool) {
	locationTypes := []string{
		nfsLocation,
	}
	locations, err := s.Pensieve.GetLocationsWithTypes(locationTypes)
	if err != nil {
		log.Println("error from getCosmosLocation", err)
		return false
	}

	for _, location := range locations {
		if bucket.FullDocument.Value.LocationConstraint == location.Name {
			bucket.LocationType = location.LocationType
			return true
		}
	}
	return false
}


// getCosmosLocation will return a string array of all locations of the given location type.
func (s *Scheduler) getCosmosLocations(locationType string) ([]string, error) {
	locations, err := s.Pensieve.GetLocationsWithTypes([]string{locationType})
	if err != nil {
		return nil, err
	}
	var ret []string
	for _, location := range locations {
		ret = append(ret, location.Name)
	}
	return ret, nil
}

// getCosmosLocationBson will return a bson map of all locations of the given location type.
func (s *Scheduler) getCosmosLocationBson(locationType string) (bson.A, error) {
	locations, err := s.Pensieve.GetLocationsWithTypes([]string{locationType})
	if err != nil {
		return nil, err
	}
	ret := bson.A{}
	for _, location := range locations {
		ret = append(ret, bson.D{
			{"fullDocument.value.locationConstraint", location.Name},
		})
	}
	return ret, nil
}

// applyChanges will create a new cosmos custom resource based off the given *BucketTransaction. If
// the *BucketTransaction is in response to a bucket deletion in Zenko, then any existing custom
// resource labeled with the bucket will be removed.
func (s *Scheduler) applyChanges(bucket *BucketTransaction) {
	location, err := s.Pensieve.GetLocationWithName(bucket.FullDocument.Value.LocationConstraint)
    if err != nil {
		log.Println("error getting location:", err)
	} 
	switch bucket.OperationType {
	case "insert" :
		log.Println("creating cosmos for bucket:", bucket.FullDocument.Value.Name)
		err = s.createCosmosFromLocation(location, bucket.FullDocument.Value.Name)
		if err != nil {
			log.Println("failed to create cosmos with error: ", err)
		}
	case "replace":
	    if bucket.FullDocument.Value.Deleted == true && s.checkForCosmos(location, bucket.FullDocument.Value.Name) {
			log.Println("deleting cosmos for bucket:", bucket.FullDocument.Value.Name)
			err := s.KubeAlpha.Cosmoses(s.Namespace).Delete(bucket.FullDocument.Value.LocationConstraint, &metav1.DeleteOptions{})
			if err != nil {
				log.Println("failed to delete cosmos with error: ", err)
			}
		} else if bucket.FullDocument.Value.Deleted == true {
			log.Println("received delete request but no cosmos created for bucket: ", bucket.FullDocument.Value.Name)
		}
	}
	return
}

// checkForCosmos looks for existing Cosmos custom resources on specified
// *pensieve.Location labeled with the given bucket string. Currently only 1 ingestion
// bucket is supported per location.
func (s *Scheduler) checkForCosmos(location *pensieve.Location, bucket string) bool {
	cosmos, err := s.KubeAlpha.Cosmoses(s.Namespace).List(metav1.ListOptions{
		LabelSelector: "bucket="+bucket,
		Limit: 1,
	})
	if err != nil {
		log.Println("error checking cosmos:", err)
	} else if len(cosmos.Items) > 0 && cosmos.Items[0].Name == location.Name {
		log.Println("cosmos name:", cosmos.Items[0].Name)
		return true
	}
	return false
}

// createCosmosFromLocation creates a new Cosmos custom resource using data from a
// *MongodbURL.Location. It assumes the location to be of type "NFS".
func (s *Scheduler) createCosmosFromLocation(location *pensieve.Location, bucket string) error {
	nfs := pensieve.NewNFSLocation(location.Details.Endpoint)
	_, err := s.KubeAlpha.Cosmoses(s.Namespace).Create(&v1alpha1.Cosmos{
		ObjectMeta: metav1.ObjectMeta{
			Name: location.Name,
			Labels: map[string]string{
				"bucket": bucket,
			},
		},
		Spec: v1alpha1.CosmosSpec{
			FullnameOverride: location.Name,
			Pfsd: v1alpha1.CosmosPfsdSpec{
				ReplicaCount: s.NodeCount,
			},
			Rclone: v1alpha1.CosmosRcloneSpec{
				Schedule: s.IngestionSchedule,
				Destination: v1alpha1.CosmosRcloneDestinationSpec{
					Endpoint:       s.Cloudserver,
					Region:         location.Name,
					Bucket:         bucket,
					ExistingSecret: s.SecretName,
				},
			},
			PersistentVolume: v1alpha1.CosmosPersistentVolumeSpec{
				Enabled:      true,
				StorageClass: s.StorageClass,
				VolumeConfig: v1alpha1.CosmosVolumeConfigSpec{
					NFS: v1alpha1.CosmosNFSSpec{
						Path:         nfs.Path,
						Server:       nfs.IPAddr,
					},
					MountOptions: nfs.Options,
				},
			},
		},
	})
	return err
}

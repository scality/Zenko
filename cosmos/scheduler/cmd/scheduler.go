package scheduler

import (
	"context"
	"encoding/json"
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
	// Routes
	healthRoute  = "/healthcheck"
	suspendRoute = "/suspend/"

	// Auth data
	access_key_id     = "access_key_id"
	secret_access_key = "secret_access_key"

	// Supported locations
	nfsLocation  = "location-nfs-mount-v1"
	awsLocation  = "location-aws-s3-v1"
	cephLocation = "location-ceph-radosgw-s3-v1"
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

// Secret describes a secret name and associated AccessKey and SecretKey
type Secret struct {
	Name      string
	AccessKey string
	SecretKey string
}

// Run starts the Cosmos Scheduler
func (s *Scheduler) Run() {
	log.Println("starting cosmos scheduler")
	// Run the health check and pause/resume server
	go s.httpServe()

	// safely create or update secret on startup
	err := s.reconcileSecrets(s.getSecret(s.SecretName), nil, true)
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
			s.reconcileSecrets(s.getSecret(s.SecretName), nil, false)
			// check for location secret updates on overlayUpdate
			s.validateExistingLocations()
		}
	}
}

type cronValues struct {
	Suspend       bool `json:"suspend"`
	Trigger       bool `json:"triggerIngestion"`
}

func (s *Scheduler) suspendRoute(w http.ResponseWriter, req *http.Request) {
	var cron cronValues
	location := req.URL.Path[len(suspendRoute):]
	cosmosLocation := s.getCosmos(location)
	if cosmosLocation == nil {
		log.Println("no cosmos found:", location)
		http.Error(w, "Cosmos location not found", http.StatusNotFound)
		return
	}
	switch req.Method {
	case "GET":
		cron = cronValues{
			Suspend: cosmosLocation.Spec.Rclone.Suspend,
			Trigger: cosmosLocation.Spec.Rclone.Trigger,
		}
		js, err := json.Marshal(cron)
		if err != nil {
			log.Println(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write(js)
		log.Println("received status request for", location)
	case "POST":
		if content := req.Header.Get("Content-Type"); content != "" && content != "application/json" {
			log.Println("Unsupported media type:", content)
			http.Error(w, "Content-Type header is not application/json", http.StatusUnsupportedMediaType)
			return
		}
		// Body should never be more than 42 bytes of json data
		dec := json.NewDecoder(http.MaxBytesReader(w, req.Body, 42))
		dec.DisallowUnknownFields()

		err := dec.Decode(&cron)
		if err != nil {
			log.Println("Error decoding json:", err.Error())
			http.Error(w, "Bad request", http.StatusBadRequest)
		}
		cosmosLocation.Spec.Rclone.Suspend = cron.Suspend
		cosmosLocation.Spec.Rclone.Trigger = cron.Trigger
		_, err = s.KubeAlpha.Cosmoses(s.Namespace).Update(cosmosLocation)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	w.Header().Set("Server", "Cosmos Scheduler")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

// healthCheckRoute will ping the MongoDB connection on every request recieved
// at :8080/healthcheck
func (s *Scheduler) healthCheckRoute(w http.ResponseWriter, req *http.Request) {
		ctx, cancel := context.WithTimeout(req.Context(), 5*time.Second)
		defer cancel()
		err := s.MongodbClient.Ping(ctx, readpref.Primary())
		if err != nil {
			log.Println("MongoDB healthcheck failed:", err)
			http.Error(w, "Could not contact MongoDB", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
}

// httpServer sets up the route handle functions and the listening server
func (s *Scheduler) httpServe() {
	http.HandleFunc(suspendRoute, s.suspendRoute)
	http.HandleFunc(healthRoute, s.healthCheckRoute)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// reconcileSecrets will validate that the secret map matches the credentials for a location resulting
// in updating the k8s secret with the replacement if there is a diff. If location is nil,
// then it will simply try to validate the builtin service account credentials. The
// verbose bool is used for start up sequences otherwise logging becomes too verbose.
func (s *Scheduler) reconcileSecrets(secret map[string][]byte, location *pensieve.Location, verbose bool) error {
	var err error
	var accessKey, secretKey, name string
	if location == nil {
		name = s.SecretName
		accessKey, secretKey, err = s.Pensieve.GetServiceAccountCredentials("md-ingestion")
	} else {
		name = location.Name
		accessKey = location.Details.AccessKey
		secretKey, err = s.Pensieve.DecryptLocationSecretKey(location.Details.SecretKey)
	}
	newSecret := &Secret{
		Name: name,
		AccessKey: accessKey,
		SecretKey: secretKey,
	}
	if err != nil {
		log.Println("error getting secret keys")
		return err
	}
	if secret == nil {
		log.Println("creating secret:", newSecret.Name)
		err = s.setSecret(newSecret, false)
		if err != nil {
			log.Println("error creating secret:", newSecret.Name)
			return err
		}
		log.Println("secret created successfully")
	} else if string(secret[access_key_id]) != accessKey || string(secret[secret_access_key]) != secretKey {
		log.Println(name, " credentials changed, updating secret")
		err = s.setSecret(newSecret, true)
		if err != nil {
			log.Println("error updating secret")
			return err
		}
		log.Println("credentials successfully patched")
	} else if verbose {
		log.Println("found valid secret:", name)
	}
	return nil
}

// validateExistingLocations will check that all CRDs have up-to-date
// credentials. TODO validate that the entire CRD state matches that
// of the location.
func (s *Scheduler) validateExistingLocations() error {
	cosmoses, err := s.KubeAlpha.Cosmoses(s.Namespace).List(metav1.ListOptions{})
	if err != nil {
		log.Println("error listing cosmos CRDs", err)
		return err
	}
	for _, cosmos := range cosmoses.Items {
		location, err := s.Pensieve.GetLocationWithName(cosmos.Name)
		if err != nil {
			log.Println("error getting location:", cosmos.Name)
			continue
		}
		// TODO validate the state of the CRD matches the state of the location
		s.reconcileSecrets(s.getSecret(cosmos.Name), location, false)
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

// getCosmos returns the *v1alpha1.Cosmos custom resource of a given location name.
// if no name is specified then all Cosmoses will be returned.
func (s *Scheduler) getCosmos(name string) (*v1alpha1.Cosmos) {
	cosmoses, err := s.KubeAlpha.Cosmoses(s.Namespace).List(metav1.ListOptions{})
	if err != nil {
		log.Println("error checking cosmos:", err)
		return nil
	}
	for _, cosmos := range cosmoses.Items {
		if name == cosmos.Name {
			return &cosmos
		}
	}
	return nil
}

// getSecret looks for a Kubernetes secret by the given name and
// returns a key value map with 'accessKey' and 'secretKey'.
// The keys are strings and the values are byte arrays.
func (s *Scheduler) getSecret(secret string) (map[string][]byte) {
	secrets, err := s.KubeClientset.CoreV1().
		Secrets(s.Namespace).Get(secret, metav1.GetOptions{})
	if err != nil {
		return nil
	}
	if len(secrets.Data) > 0 {
		return secrets.Data
	}
	return nil
}

// setSecret creates or updates a Kubernetes secret based on the type Secret argument.
// The bool argument can be used to patch an existing secret.
func (s *Scheduler) setSecret(secret *Secret, patch bool) error {
	kubeSecret := &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secret.Name,
			Namespace: s.Namespace,
			Labels: map[string]string{
				"ingestionCredentials": "true",
			},
		},
		Type: "Opaque",
		Data: map[string][]byte{
			access_key_id: []byte(secret.AccessKey),
			secret_access_key: []byte(secret.SecretKey),
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
		awsLocation,
		cephLocation,
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

// unused
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

// unused
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
			err := s.KubeAlpha.Cosmoses(s.Namespace).Delete(location.Name, &metav1.DeleteOptions{})
			if err != nil {
				log.Println("failed to delete cosmos with error: ", err)
			}
			if bucket.LocationType != nfsLocation {
				err = s.KubeClientset.CoreV1().Secrets(s.Namespace).Delete(location.Name, &metav1.DeleteOptions{})
				if err != nil {
					log.Println("error deleting cosmos secret ", location.Name, err)
				}
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

// createCosmosFromLocation checks the location type and dispatches the proper function to
// create the custom resource. New location types should be added here and treated accordingly.
func (s *Scheduler) createCosmosFromLocation(location *pensieve.Location, bucket string) error {
	switch location.LocationType {
	case nfsLocation:
		return s.createCosmosNFSLocation(location, bucket)
	case awsLocation:
		return s.createCosmosAWSLocation(location, bucket)
	case cephLocation:
		return s.createCosmosCephLocation(location, bucket)
	default:
		log.Println("location type not supported: ", location.LocationType)
	}
	return nil
}

// createCosmosNFSLocation creates a new Cosmos custom resource using data from a
// *MongodbURL.Location. It assumes the location to be of type "NFS".
func (s *Scheduler) createCosmosNFSLocation(location *pensieve.Location, bucket string) error {
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
			Pfsd: &v1alpha1.CosmosPfsdSpec{
				Enabled: true,
				ReplicaCount: s.NodeCount,
			},
			Rclone: &v1alpha1.CosmosRcloneSpec{
				Schedule: s.IngestionSchedule,
				Suspend: true,
				Trigger: false,
				Source: &v1alpha1.CosmosRcloneSourceSpec{
					Type: "local",
				},
				Destination: &v1alpha1.CosmosRcloneDestinationSpec{
					Endpoint:       s.Cloudserver,
					Region:         location.Name,
					Bucket:         bucket,
					ExistingSecret: s.SecretName,
				},
				Options: &v1alpha1.CosmosRcloneOptionsSpec{
					Transfers: 32,
					Checkers: 64,
				},
			},
			PersistentVolume: &v1alpha1.CosmosPersistentVolumeSpec{
				Enabled:      true,
				StorageClass: s.StorageClass,
				VolumeConfig: &v1alpha1.CosmosVolumeConfigSpec{
					NFS: &v1alpha1.CosmosNFSSpec{
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

// createCosmosAWSLocation creates a new Cosmos custom resource using data from a
// *MongodbURL.Location. It assumes the location to be of type "AWS".
func (s *Scheduler) createCosmosAWSLocation(location *pensieve.Location, bucket string) error {
	err := s.reconcileSecrets(nil, location, false)
	if err != nil {
		log.Println("error creating location secret")
		return err
	}
	_, err = s.KubeAlpha.Cosmoses(s.Namespace).Create(&v1alpha1.Cosmos{
		ObjectMeta: metav1.ObjectMeta{
			Name: location.Name,
			Labels: map[string]string{
				"bucket": bucket,
			},
		},
		Spec: v1alpha1.CosmosSpec{
			FullnameOverride: location.Name,
			Pfsd: &v1alpha1.CosmosPfsdSpec{
				Enabled: false,
			},
			Rclone: &v1alpha1.CosmosRcloneSpec{
				Schedule: s.IngestionSchedule,
				Suspend: true,
				Trigger: false,
				Source: &v1alpha1.CosmosRcloneSourceSpec{
					Type: "s3",
					Provider: "AWS",
					Endpoint: location.Details.Endpoint,
					Bucket: location.Details.Bucket,
					Region: location.Details.Region,
					ExistingSecret: location.Name,
				},
				Destination: &v1alpha1.CosmosRcloneDestinationSpec{
					Endpoint:       s.Cloudserver,
					Region:         location.Name,
					Bucket:         bucket,
					ExistingSecret: s.SecretName,
				},
				Options: &v1alpha1.CosmosRcloneOptionsSpec{
					Transfers: 32,
					Checkers: 64,
				},
			},
		},
	})
	return err
}

// createCosmosCephLocation creates a new Cosmos custom resource using data from a
// *MongodbURL.Location. It assumes the location to be of type "Ceph".
func (s *Scheduler) createCosmosCephLocation(location *pensieve.Location, bucket string) error {
	err := s.reconcileSecrets(nil, location, false)
	if err != nil {
		log.Println("error creating location secret")
		return err
	}
	_, err = s.KubeAlpha.Cosmoses(s.Namespace).Create(&v1alpha1.Cosmos{
		ObjectMeta: metav1.ObjectMeta{
			Name: location.Name,
			Labels: map[string]string{
				"bucket": bucket,
			},
		},
		Spec: v1alpha1.CosmosSpec{
			FullnameOverride: location.Name,
			Pfsd: &v1alpha1.CosmosPfsdSpec{
				Enabled: false,
			},
			Rclone: &v1alpha1.CosmosRcloneSpec{
				Schedule: s.IngestionSchedule,
				Suspend: true,
				Trigger: false,
				Source: &v1alpha1.CosmosRcloneSourceSpec{
					Type: "s3",
					Provider: "Ceph",
					Endpoint: location.Details.Endpoint,
					Bucket: location.Details.Bucket,
					Region: location.Details.Region,
					ExistingSecret: location.Name,
				},
				Destination: &v1alpha1.CosmosRcloneDestinationSpec{
					Endpoint:       s.Cloudserver,
					Region:         location.Name,
					Bucket:         bucket,
					ExistingSecret: s.SecretName,
				},
				Options: &v1alpha1.CosmosRcloneOptionsSpec{
					Transfers: 32,
					Checkers: 64,
				},
			},
		},
	})
	return err
}

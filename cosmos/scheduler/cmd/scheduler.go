package scheduler

import (
	"context"
	"log"

	"github.com/mongodb/mongo-go-driver/bson"
	"github.com/mongodb/mongo-go-driver/mongo"
	"github.com/scality/zenko/cosmos/api/types/v1alpha1"
	clientV1alpha1 "github.com/scality/zenko/cosmos/clientset/v1alpha1"
	"github.com/scality/zenko/cosmos/scheduler/pkg"
	"k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// Scheduler represents a Cosmos Scheduler instance
type Scheduler struct {
	KubeAlpha         *clientV1alpha1.ExampleV1Alpha1Client
	KubeClientset     *kubernetes.Clientset
	Pensieve          *pensieve.Helper
	Namespace         string
	Cloudserver       string
	StorageClass      string
	MongodbClient     *mongo.Client
	SecretName        string
	IngestionSchedule string
}

// Run starts the Cosmos Scheduler
func (s *Scheduler) Run() {
	log.Println("starting cosmos scheduler")
	quit := make(chan bool)
	overlayUpdates, err := s.watchOverlayUpdates()
	if err != nil {
		log.Println(err)
		return
	}
	for {
		go s.watchBucketUpdates(quit)
		<-overlayUpdates
		log.Println("received an overlay update")
		quit <- true
	}
}

func (s *Scheduler) configureIngestionSecret() error {
	accessKey, secretKey, err := s.Pensieve.GetServiceAccountCredentials("md-ingestion")
	if err != nil {
		return err
	}
	secret := s.getIngestionSecret()
	if secret == nil {
		log.Println("creating ingestion secret")
		err = s.ingestionSecret(accessKey, secretKey, false)
		if err != nil {
			return err
		}
		log.Println("ingestion secret created successfully")
	} else if string(secret["accessKey"]) != accessKey || string(secret["secretKey"]) != secretKey {
		log.Println("ingestion credentials changed, updating secret")
		err = s.ingestionSecret(accessKey, secretKey, true)
		if err != nil {
			return err
		}
		log.Println("ingestion credentials successfully patched")
	}  else {
		log.Println("found existing up-to-date ingestion secret")
	}
	return nil
}

func (s *Scheduler) watchBucketUpdates(quit chan bool) error {
	locationBson, err := s.getCosmosLocationBson()
	if err != nil {
		return err
	}
	if len(locationBson) == 0 {
		return nil
	}
	collection := s.MongodbClient.Database("metadata").Collection("__metastore")
	ctx := context.Background()
	cur, err := collection.Watch(ctx, mongo.Pipeline{
		{{"$match", bson.D{
			{"$or", locationBson},
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
	if err != nil {
		log.Println(err)
		return err
	}
	ch := make(chan BucketTransaction)
	go func() {
		defer cur.Close(ctx)
		for {
			if cur.Next(ctx) {
				var elem BucketTransaction
				if err := cur.Decode(&elem); err != nil {
					log.Println(err)
					return
				}
				ch <- elem
			} else {
				if err := cur.Err(); err != nil {
					log.Println(err)
				}
				return
			}
		}
	}()
	for {
		select {
		case <-quit:
			cur.Close(ctx)
			return nil
		case bucket := <-ch:
			s.applyChanges(&bucket)
		}
	}
}

func (s *Scheduler) watchOverlayUpdates() (chan interface{}, error) {
	ch := make(chan interface{})
	collection := s.MongodbClient.Database("metadata").Collection("PENSIEVE")
	ctx := context.Background()
	cur, err := collection.Watch(ctx, mongo.Pipeline{})
	if err != nil {
		close(ch)
		return nil, err
	}
	go func() {
		for {
			if cur.Next(ctx) {
				ch <- "overlay update"
			}
			if err := cur.Err(); err != nil {
				log.Println(err)
			}
			err := s.configureIngestionSecret()
			if err != nil {
				close(ch)
				cur.Close(ctx)
				log.Panicln(err.Error())
			}
		}
	}()
	return ch, nil
}

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

func (s *Scheduler) ingestionSecret(accessKey string, secretKey string, patch bool) error {
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

func (s *Scheduler) getCosmosLocationBson() (bson.A, error) {
	locations, err := s.Pensieve.GetLocationsWithTypes([]string{"nfs"})
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

type BucketTransaction struct {
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

func (s *Scheduler) applyChanges(bucket *BucketTransaction) {
	location, err := s.Pensieve.GetLocationWithName(bucket.FullDocument.Value.LocationConstraint)
    if err != nil {
		log.Println("error getting location", err)
	} 
	switch bucket.OperationType {
	case "insert" :
		log.Println("creating cosmos for bucket:", bucket.FullDocument.Value.Name)
		err = s.createCosmosFromLocation(location, bucket.FullDocument.Value.Name)
		if err != nil {
			log.Println("failed to create cosmos with error:", err)
		}
	case "replace":
	    if bucket.FullDocument.Value.Deleted == true && s.checkForCosmos(location, bucket.FullDocument.Value.Name) {
			log.Println("deleting cosmos for bucket:", bucket.FullDocument.Value.Name)
			err := s.KubeAlpha.Cosmoses(s.Namespace).Delete(bucket.FullDocument.Value.LocationConstraint, &metav1.DeleteOptions{})
			if err != nil {
				log.Println(err)
			}
		} else {
			log.Println("received delete request but no cosmos created for bucket:", bucket.FullDocument.Value.Name)
		}
	}
	return
}

// Check for existing Cosmos on specified location labeled with the given bucket.
// Currently only 1 ingestion bucket is supported per location
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

// createCosmosFromLocation creates a new Cosmos CR using data from a
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

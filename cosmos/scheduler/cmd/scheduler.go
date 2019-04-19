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
	err := s.configureIngestionSecret()
	if err != nil {
		log.Panicln(err.Error())
	}
	quit := make(chan bool)
	overlayUpdates, err := s.watchOverlayUpdates()
	if err != nil {
		log.Println(err)
		return
	}
	for {
		go s.run(quit)
		<-overlayUpdates
		log.Println("got an overlay update")
		quit <- true
	}
}

func (s *Scheduler) configureIngestionSecret() error {
	secret, err := s.getIngestionSecret()
	if err != nil {
		return err
	}
	if secret["accessKey"] != nil {
		log.Println("ingestion credentials secret found")
		return nil
	}
	log.Println("ingestion secret not found")
	err = s.createIngestionSecret()
	if err != nil {
		return err
	}
	log.Println("ingestion secret created successfully")
	return nil
}

func (s *Scheduler) run(quit chan bool) error {
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
		}
	}()
	return ch, nil
}

func (s *Scheduler) getIngestionSecret() (map[string][]byte, error) {
	secrets, err := s.KubeClientset.CoreV1().
		Secrets(s.Namespace).Get(s.SecretName, metav1.GetOptions{})
	if err != nil {
		return nil, nil
	}
	if len(secrets.Data) > 0 {
		return secrets.Data, nil
	}
	return nil, nil
}

func (s *Scheduler) createIngestionSecret() error {
	accessKey, secretKey, err := s.Pensieve.GetServiceAccountCredentials("md-ingestion")
	if err != nil {
		return err
	}
	_, err = s.KubeClientset.CoreV1().Secrets(s.Namespace).Create(&v1.Secret{
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
	})
	if err != nil {
		return err
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
	if bucket.OperationType == "insert" {
		log.Println("creating cosmos for bucket:", bucket.FullDocument.Value.Name)
		location, err := s.Pensieve.GetLocationWithName(bucket.FullDocument.Value.LocationConstraint)
		if err != nil {
			log.Println(err)
			return
		}
		s.CreateCosmosFromLocation(location, bucket.FullDocument.Value.Name)
	} else if bucket.OperationType == "replace" && bucket.FullDocument.Value.Deleted == true {
		log.Println("deleting cosmos for bucket:", bucket.FullDocument.Value.Name)
		err := s.KubeAlpha.Cosmoses(s.Namespace).Delete(bucket.FullDocument.Value.LocationConstraint+"-"+bucket.FullDocument.Value.Name, &metav1.DeleteOptions{})
		if err != nil {
			log.Println(err)
			return
		}
	}
}

// CreateCosmosFromLocation creates a new Cosmos CR using data from a
// *MongodbURL.Location. It assumes the location to be of type "NFS".
func (s *Scheduler) CreateCosmosFromLocation(location *pensieve.Location, bucket string) error {
	nfs := pensieve.NewNFSLocation(location.Details.Endpoint)
	_, err := s.KubeAlpha.Cosmoses(s.Namespace).Create(&v1alpha1.Cosmos{
		ObjectMeta: metav1.ObjectMeta{
			Name: location.Name,
		},
		Spec: v1alpha1.CosmosSpec{
			FullnameOverride: location.Name,
			Rclone: v1alpha1.CosmosRcloneSpec{
				Schedule: s.IngestionSchedule,
				Remote: v1alpha1.CosmosRcloneRemoteSpec{
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
						MountOptions: nfs.Options,
					},
				},
			},
		},
	})
	return err
}

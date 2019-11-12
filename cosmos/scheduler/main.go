package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"

	"github.com/scality/zenko/cosmos/api/types/v1alpha1"
	clientV1alpha1 "github.com/scality/zenko/cosmos/clientset/v1alpha1"
	scheduler "github.com/scality/zenko/cosmos/scheduler/cmd"
	"github.com/scality/zenko/cosmos/scheduler/pkg"
	"github.com/spf13/viper"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

const (
	pensieveCollection = "PENSIEVE"
)

func init() {
	viper.BindEnv("kubeconfig")

	viper.SetDefault("namespace", "default")
	viper.BindEnv("namespace")

    viper.SetDefault("node_count", "3")
    viper.BindEnv("node_count")

	viper.SetDefault("mongodb_hosts", "localhost:27017")
	viper.BindEnv("mongodb_hosts")

	viper.SetDefault("mongodb_database", "metadata")
	viper.BindEnv("mongodb_database")

	viper.SetDefault("cloudserver_endpoint", "http://localhost:8000")
	viper.BindEnv("cloudserver_endpoint")

	viper.SetDefault("storage_class", "my-storage-class")
	viper.BindEnv("storage_class")

	viper.SetDefault("ingestion_schedule", "* */12 * * *")
	viper.BindEnv("ingestion_schedule")

	viper.SetDefault("ingestion_secret_name", "cosmos-metadata-ingestion")
	viper.BindEnv("ingestion_secret_name")
}

// The main function esablishes the mongodb connection, validates kube api access,
// and instanciates the scheduler run loop.
func main() {
	mongoOptions := options.Client()
	mongoOptions.SetAppName("cosmos-scheduler")
	mongoOptions.ApplyURI("mongodb://"+viper.GetString("mongodb_hosts"))
	mongoOptions.SetReadPreference(readpref.Primary())
	
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, mongoOptions)
	if err != nil {
		log.Fatal("error connecting to MongoDB: ", err.Error())
	}
	pensieveCollection := mongoClient.Database(viper.GetString("mongodb_database")).Collection(pensieveCollection)

	var config *rest.Config
	kubeconfig := viper.GetString("kubeconfig")
	if kubeconfig == "" {
		log.Printf("using in-cluster configuration")
		config, err = rest.InClusterConfig()
	} else {
		log.Printf("using configuration from '%s'", kubeconfig)
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	}
	if err != nil {
		log.Fatal("error accessing kubernetes: ", err)
	}

	err = v1alpha1.AddToScheme(scheme.Scheme)
	if err != nil {
		log.Fatal("error adding scheme: ", err)
	}

	kubeAlpha, err := clientV1alpha1.NewForConfig(config)
	if err != nil {
		log.Fatal("error creating alpha config: ", err)
	}

	kubeClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatal("error creating kubernetes client: ", err)
	}

	(&scheduler.Scheduler{
		KubeAlpha:         kubeAlpha,
		KubeClientset:     kubeClient,
		Pensieve:          pensieve.NewHelper(pensieveCollection),
		Database:          viper.GetString("mongodb_database"),
		Namespace:         viper.GetString("namespace"),
		NodeCount:         viper.GetString("node_count"),
		Cloudserver:       viper.GetString("cloudserver_endpoint"),
		StorageClass:      viper.GetString("storage_class"),
		SecretName:        viper.GetString("ingestion_secret_name"),
		IngestionSchedule: viper.GetString("ingestion_schedule"),
		MongodbClient:     mongoClient,
	}).Run()
}

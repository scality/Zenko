package main

import (
	"context"
	"log"
	"time"

	"github.com/mongodb/mongo-go-driver/mongo"

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
	metadataDatabase   = "metadata"
	pensieveCollection = "PENSIEVE"
)

func init() {
	viper.BindEnv("kubeconfig")

	viper.SetDefault("namespace", "default")
	viper.BindEnv("namespace")

	viper.SetDefault("mongodb_hosts", "localhost:27017")
	viper.BindEnv("mongodb_hosts")

	viper.SetDefault("cloudserver_endpoint", "localhost:8000")
	viper.BindEnv("cloudserver_endpoint")

	viper.SetDefault("storage_class", "my-storage-class")
	viper.BindEnv("storage_class")

	viper.SetDefault("ingestion_schedule", "* */12 * * *")
	viper.BindEnv("ingestion_schedule")

	viper.SetDefault("ingestion_secret_name", "cosmos-metadata-ingestion")
	viper.BindEnv("ingestion_secret_name")
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, "mongodb://"+viper.GetString("mongodb_hosts"))
	if err != nil {
		panic(err.Error())
	}
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
		panic(err.Error())
	}
	err = v1alpha1.AddToScheme(scheme.Scheme)
	if err != nil {
		panic(err.Error())
	}
	kubeAlpha, err := clientV1alpha1.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}
	kubeClient, err := kubernetes.NewForConfig(config)
	(&scheduler.Scheduler{
		KubeAlpha:         kubeAlpha,
		KubeClientset:     kubeClient,
		Pensieve:          pensieve.NewHelper(mongoClient.Database(metadataDatabase).Collection(pensieveCollection)),
		Namespace:         viper.GetString("namespace"),
		Cloudserver:       viper.GetString("cloudserver_endpoint"),
		StorageClass:      viper.GetString("storage_class"),
		SecretName:        viper.GetString("ingestion_secret_name"),
		IngestionSchedule: viper.GetString("ingestion_schedule"),
		MongodbClient:     mongoClient,
	}).Run()
}

package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type Cosmos struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec CosmosSpec `json:"spec"`
}

type CosmosList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Cosmos `json:"items"`
}

type CosmosSpec struct {
	FullnameOverride string                      `json:"fullnameOverride"`
	Pfsd             *CosmosPfsdSpec             `json:"pfsd,omitempty"`
	Rclone           *CosmosRcloneSpec           `json:"rclone"`
	PersistentVolume *CosmosPersistentVolumeSpec `json:"persistentVolume,omitempty"`
}

type CosmosPfsdSpec struct {
	Enabled      bool    `json:"enabled"`
	ReplicaCount string  `json:"replicaCount,omitempty"`
}

type CosmosRcloneSpec struct {
	Schedule      string                       `json:"schedule"`
	Suspend       bool                         `json:"suspend"`
	Trigger       bool                         `json:"triggerIngestion"`
	Source        *CosmosRcloneSourceSpec      `json:"source"`
	Destination   *CosmosRcloneDestinationSpec `json:"destination"`
	Options       *CosmosRcloneOptionsSpec     `json:"options"`
}

type CosmosRcloneSourceSpec struct {
	Type           string `json:"type"`
	Provider       string `json:"provider,omitempty"`
	Endpoint       string `json:"endpoint,omitempty"`
	Region         string `json:"region,omitempty"`
	Bucket         string `json:"bucket,omitempty"`
	ExistingSecret string `json:"existingSecret,omitempty"`
}

type CosmosRcloneDestinationSpec struct {
	Endpoint       string `json:"endpoint"`
	Region         string `json:"region"`
	Bucket         string `json:"bucket"`
	ExistingSecret string `json:"existingSecret"`
}

type CosmosRcloneOptionsSpec struct {
	Transfers int64 `json:"transfers"`
	Checkers  int64 `json:"checkers"`
}

type CosmosPersistentVolumeSpec struct {
	Enabled      bool                   `json:"enabled"`
	StorageClass string                 `json:"storageClass"`
	VolumeConfig *CosmosVolumeConfigSpec `json:"volumeConfig"`
}

type CosmosVolumeConfigSpec struct {
	NFS          *CosmosNFSSpec `json:"nfs"`
	MountOptions []string      `json:"mountOptions"`
}

type CosmosNFSSpec struct {
	Path         string `json:"path"`
	Server       string `json:"server"`
}

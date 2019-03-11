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
	FullnameOverride string                     `json:"fullnameOverride"`
	Rclone           CosmosRcloneSpec           `json:"rclone"`
	PersistentVolume CosmosPersistentVolumeSpec `json:"persistentVolume"`
}

type CosmosRcloneSpec struct {
	Schedule string                 `json:"schedule"`
	Remote   CosmosRcloneRemoteSpec `json:"remote"`
}

type CosmosRcloneRemoteSpec struct {
	Endpoint       string `json:"endpoint"`
	Region         string `json:"region"`
	Bucket         string `json:"bucket"`
	ExistingSecret string `json:"existingSecret"`
}

type CosmosPersistentVolumeSpec struct {
	Enabled      bool                   `json:"enabled"`
	StorageClass string                 `json:"storageClass"`
	VolumeConfig CosmosVolumeConfigSpec `json:"volumeConfig"`
}

type CosmosVolumeConfigSpec struct {
	NFS CosmosNFSSpec `json:"nfs"`
}

type CosmosNFSSpec struct {
	Path         string `json:"path"`
	Server       string `json:"server"`
	MountOptions string `json:"mountOptions"`
}

package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type CosmosRcloneSpec struct {
	Schedule string                 `json:"schedule"`
	Remote   CosmosRcloneRemoteSpec `json:"remote"`
}

type CosmosRcloneRemoteSpec struct {
	Endpoint string `json:"endpoint"`
	Region   string `json:"region"`
	Bucket   string `json:"bucket"`
}

type CosmosPfsdServiceSpec struct {
	Name string `json:"name"`
}

type CosmosPfsdSpec struct {
	Service CosmosPfsdServiceSpec `json:"service"`
}

type CosmosBackendSpec struct {
	Type     string `json:"type"`
	Endpoint string `json:"endpoint"`
	Path     string `json:"path"`
	Options  string `json:"options"`
}

type CosmosSpec struct {
	Pfsd    CosmosPfsdSpec    `json:"pfsd"`
	Rclone  CosmosRcloneSpec  `json:"rclone"`
	Backend CosmosBackendSpec `json:"storageBackend"`
}

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

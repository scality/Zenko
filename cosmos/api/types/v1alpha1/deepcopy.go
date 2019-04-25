package v1alpha1

import "k8s.io/apimachinery/pkg/runtime"

// DeepCopyInto copies all properties of this object into another object of the
// same type that is provided as a pointer.
func (in *Cosmos) DeepCopyInto(out *Cosmos) {
	out.TypeMeta = in.TypeMeta
	out.ObjectMeta = in.ObjectMeta
	out.Spec = CosmosSpec{
		FullnameOverride: in.Spec.FullnameOverride,
		Rclone: CosmosRcloneSpec{
			Schedule: in.Spec.Rclone.Schedule,
			Destination: CosmosRcloneDestinationSpec{
				Endpoint: in.Spec.Rclone.Destination.Endpoint,
				Region:   in.Spec.Rclone.Destination.Region,
				Bucket:   in.Spec.Rclone.Destination.Bucket,
			},
		},
		PersistentVolume: CosmosPersistentVolumeSpec{
			Enabled:      in.Spec.PersistentVolume.Enabled,
			StorageClass: in.Spec.PersistentVolume.StorageClass,
			VolumeConfig: CosmosVolumeConfigSpec{
				NFS: CosmosNFSSpec{
					Path:         in.Spec.PersistentVolume.VolumeConfig.NFS.Path,
					Server:       in.Spec.PersistentVolume.VolumeConfig.NFS.Server,
				},
				MountOptions: in.Spec.PersistentVolume.VolumeConfig.MountOptions,
			},
		},
	}
}

// DeepCopyObject returns a generically typed copy of an object
func (in *Cosmos) DeepCopyObject() runtime.Object {
	out := Cosmos{}
	in.DeepCopyInto(&out)

	return &out
}

// DeepCopyObject returns a generically typed copy of an object
func (in *CosmosList) DeepCopyObject() runtime.Object {
	out := CosmosList{}
	out.TypeMeta = in.TypeMeta
	out.ListMeta = in.ListMeta

	if in.Items != nil {
		out.Items = make([]Cosmos, len(in.Items))
		for i := range in.Items {
			in.Items[i].DeepCopyInto(&out.Items[i])
		}
	}

	return &out
}

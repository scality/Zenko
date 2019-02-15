package v1alpha1

import "k8s.io/apimachinery/pkg/runtime"

// DeepCopyInto copies all properties of this object into another object of the
// same type that is provided as a pointer.
func (in *Cosmos) DeepCopyInto(out *Cosmos) {
	out.TypeMeta = in.TypeMeta
	out.ObjectMeta = in.ObjectMeta
	out.Spec = CosmosSpec{
		Pfsd:    in.Spec.Pfsd,
		Rclone:  in.Spec.Rclone,
		Backend: in.Spec.Backend,
		// TODO: Make this more deep
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

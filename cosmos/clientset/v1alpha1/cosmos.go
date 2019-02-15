package v1alpha1

import (
	"github.com/scality/zenko/cosmos/api/types/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type CosmosInterface interface {
	List(opts metav1.ListOptions) (*v1alpha1.CosmosList, error)
	Get(name string, options metav1.GetOptions) (*v1alpha1.Cosmos, error)
	Create(*v1alpha1.Cosmos) (*v1alpha1.Cosmos, error)
	Update(*v1alpha1.Cosmos) (*v1alpha1.Cosmos, error)
	Delete(name string, options *metav1.DeleteOptions) error
	Watch(opts metav1.ListOptions) (watch.Interface, error)
	// ...
}

type CosmosClient struct {
	restClient rest.Interface
	ns         string
}

func (c *CosmosClient) List(opts metav1.ListOptions) (*v1alpha1.CosmosList, error) {
	result := v1alpha1.CosmosList{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("cosmoses").
		VersionedParams(&opts, scheme.ParameterCodec).
		Do().
		Into(&result)

	return &result, err
}

func (c *CosmosClient) Get(name string, opts metav1.GetOptions) (*v1alpha1.Cosmos, error) {
	result := v1alpha1.Cosmos{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("cosmoses").
		Name(name).
		VersionedParams(&opts, scheme.ParameterCodec).
		Do().
		Into(&result)

	return &result, err
}

func (c *CosmosClient) Create(Cosmos *v1alpha1.Cosmos) (*v1alpha1.Cosmos, error) {
	result := v1alpha1.Cosmos{}
	err := c.restClient.
		Post().
		Namespace(c.ns).
		Resource("cosmoses").
		Body(Cosmos).
		Do().
		Into(&result)

	return &result, err
}

func (c *CosmosClient) Update(cosmos *v1alpha1.Cosmos) (*v1alpha1.Cosmos, error) {
	result := &v1alpha1.Cosmos{}
	err := c.restClient.Put().
		Namespace(c.ns).
		Resource("cosmoses").
		Name(cosmos.Name).
		Body(cosmos).
		Do().
		Into(result)

	return result, err
}

func (c *CosmosClient) Delete(name string, options *metav1.DeleteOptions) error {
	return c.restClient.Delete().
		Namespace(c.ns).
		Resource("cosmoses").
		Name(name).
		Body(options).
		Do().
		Error()
}

func (c *CosmosClient) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	opts.Watch = true
	return c.restClient.
		Get().
		Namespace(c.ns).
		Resource("cosmoses").
		VersionedParams(&opts, scheme.ParameterCodec).
		Watch()
}

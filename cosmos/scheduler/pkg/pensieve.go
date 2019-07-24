package pensieve

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Helper represents a wrapper around the PENSIEVE collection.
type Helper struct {
	collection *mongo.Collection
}

// ServiceAccount represents a Zenko service account.
type ServiceAccount struct {
	UserName    string `bson:"userName" json:"userName"`
	AccessKey   string `bson:"accessKey" json:"accessKey"`
	SecretKey   string `bson:"secretKey" json:"secretKey"`
	AccountType string `bson:"accountType" json:"accountType"`
}

// Location represents a storage location in Zenko.
type Location struct {
	IsBuiltin    bool   `bson:"isBuiltin" json:"isBuiltin"`
	LocationType string `bson:"locationType" json:"locationType"`
	Name         string `bson:"name" json:"name"`
	ObjectID     string `bson:"objectId" json:"objectId"`
	Details      struct {
		Endpoint string `bson:"endpoint" json:"endpoint"`
	}
}

const (
	authToken            = "auth/zenko/remote-management-token"
	overlayVersion       = "configuration/overlay-version"
	configurationOverlay = "configuration/overlay/"
)

// NewHelper creates a new Helper. It expects the PENSIEVE collection of type
// mongo.Collection as argument
func NewHelper(pensieve *mongo.Collection) *Helper {
	return &Helper{collection: pensieve}
}

// GetCollection returns the collection of an instanciated pensieve *Helper
func (pensieve *Helper) GetCollection() *mongo.Collection {
	return pensieve.collection
}

// GetLatestOverlayVersion returns an int representing the latest overlay
// version or an error.
func (pensieve *Helper) GetLatestOverlayVersion() (int, error) {
	var result struct {
		Value int
	}
	err := pensieve.queryID(overlayVersion).Decode(&result)
	if err != nil {
		return 0, err
	}
	return result.Value, nil
}

// GetLocations returns a map of the locations found or an error.
func (pensieve *Helper) GetLocations() (map[string]Location, error) {
	version, err := pensieve.GetLatestOverlayVersion()
	if err != nil {
		return nil, err
	}
	var result struct {
		Value struct {
			Locations map[string]Location
		}
	}
	err = pensieve.queryID(configurationOverlay + strconv.Itoa(version)).Decode(&result)
	if err != nil {
		return nil, err
	}
	return result.Value.Locations, nil
}

// GetLocationWithName returns a Location that matches the given name or an error.
func (pensieve *Helper) GetLocationWithName(name string) (*Location, error) {
	locations, err := pensieve.GetLocations()
	if err != nil {
		return nil, err
	}
	for _, loc := range locations {
		if loc.Name == name {
			return &loc, nil
		}
	}
	return nil, fmt.Errorf("location %s not found", name)
}

// GetLocationsWithTypes returns a slice of all the storage locations that
// have one of the types passed as argument or an error.
func (pensieve *Helper) GetLocationsWithTypes(types []string) ([]Location, error) {
	locations, err := pensieve.GetLocations()
	if err != nil {
		return nil, err
	}
	ret := make([]Location, 0)
	for _, loc := range locations {
		for _, t := range types {
			if strings.Contains(loc.LocationType, t) {
				ret = append(ret, loc)
			}
		}
	}
	return ret, nil
}

// GetInstancePrivateKey returns the private key of a Zenko instance or an error.
func (pensieve *Helper) GetInstancePrivateKey() (string, error) {
	var result struct {
		Value struct {
			PrivateKey string `bson:"privateKey" json:"privateKey"`
		}
	}
	err := pensieve.queryID(authToken).Decode(&result)
	if err != nil {
		return "", err
	}
	return result.Value.PrivateKey, nil
}

// GetServiceAccount returns a *ServiceAccount that corresponds to the given
// name or an error.
func (pensieve *Helper) GetServiceAccount(name string) (*ServiceAccount, error) {
	accounts, err := pensieve.GetServiceAccounts()
	if err != nil {
		return nil, err
	}
	for _, account := range accounts {
		if strings.Contains(account.AccountType, name) {
			return &account, nil
		}
	}
	return nil, errors.New("service account not found")
}

// GetServiceAccounts returns an slice of all the service accounts that exist
// or an error.
func (pensieve *Helper) GetServiceAccounts() ([]ServiceAccount, error) {
	version, err := pensieve.GetLatestOverlayVersion()
	if err != nil {
		return nil, err
	}
	var result struct {
		Value struct {
			Users []ServiceAccount
		}
	}
	err = pensieve.queryID(configurationOverlay + strconv.Itoa(version)).Decode(&result)
	if err != nil {
		return nil, err
	}
	return result.Value.Users, nil
}

// GetServiceAccountCredentials returns the accessKey and secretKey of the
// given service account name or an error.
func (pensieve *Helper) GetServiceAccountCredentials(name string) (string, string, error) {
	account, err := pensieve.GetServiceAccount(name)
	if err != nil {
		return "", "", err
	}
	privateKey, err := pensieve.GetInstancePrivateKey()
	if err != nil {
		return "", "", err
	}
	secretKey, err := decryptKey(account.SecretKey, privateKey)
	if err != nil {
		return "", "", err
	}
	return account.AccessKey, secretKey, nil

}

func decryptKey(secretKey, privateKey string) (string, error) {
	pemBlock, _ := pem.Decode([]byte(privateKey))
	pKey, err := x509.ParsePKCS1PrivateKey(pemBlock.Bytes)
	if err != nil {
		return "", err
	}
	b64, err := base64.StdEncoding.DecodeString(secretKey)
	if err != nil {
		return "", err
	}
	der, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, pKey, b64, []byte(""))
	if err != nil {
		return "", err
	}
	return string(der), nil
}

func (pensieve *Helper) queryID(id string) *mongo.SingleResult {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return pensieve.collection.FindOne(ctx, bson.M{"_id": id})
}

// NFSLocation represents a storage location of type NFS.s
type NFSLocation struct {
	IPAddr  string
	Path    string
	Options []string
}

// NewNFSLocation returns a *NFSLocation the corresponds to the given endpoint.
// It assumes that the endpoint is properly formed.
// Example given endpoint: "tcp+v3://10.10.4.15/ci?ro,async"
func NewNFSLocation(endpoint string) *NFSLocation {
	var options []string
	options = append(options, "proto="+endpoint[:3],"nfsvers="+endpoint[5:6],)
	ipStart := strings.Index(endpoint, "//") + 2
	ipEnd := strings.Index(endpoint[ipStart:], "/") + len(endpoint[:ipStart])
	optionsStart := len(endpoint)
	if strings.Contains(endpoint, "?") {
	    optionsStart = strings.Index(endpoint, "?")
		options = append(options, strings.SplitN(endpoint[optionsStart+1:], ",", strings.Index(endpoint, "?"))...)
	}
	return &NFSLocation{
		IPAddr:  endpoint[ipStart:ipEnd],
		Path:    endpoint[ipEnd:optionsStart],
		Options: options,
	}
}

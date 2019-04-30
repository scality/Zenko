package pensieve

import (
	"testing"
)

func TestNewNFSLocation(t *testing.T) {
	nfs1 := NewNFSLocation("tcp+v3://10.10.4.15/ci?ro,async")
	nfs2 := NewNFSLocation("tcp+v3://10.10.4.15/ci")
	case1 := []string{"proto=tcp", "nfsvers=3", "ro", "async"}
	case2 := []string{"proto=tcp", "nfsvers=3"}
	if nfs1.IPAddr != "10.10.4.15" {
		t.Errorf("IP address is incorrect, got '%s' expected '10.10.4.15'", nfs1.IPAddr)
	}
	if nfs1.Path != "/ci" {
		t.Errorf("Path was is incorrect, got '%s' expected '/ci'", nfs1.Path)
	}
	for i, option := range nfs1.Options{
	    if option != case1[i] {
	        t.Errorf("Options parsing was incorrect, got '%s' expected '%s'", option, case1[i])
	    }
	}
	for i, option := range nfs2.Options{
	    if option != case2[i] {
	        t.Errorf("Options parsing was incorrect, got '%s' expected '%s'", option, case2[i])
	    }
	}
}

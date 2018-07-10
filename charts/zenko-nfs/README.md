# Zenko NFS Chart

This chart allows you to expose the content of buckets created with Zenko through NFS exports.

## TL;DR;

TODO: Add svg

## Prerequisites

A storage location of type `Scality RING with Sproxyd Connector` must be configured with Orbit in order to use this chart. Additionally, every bucket that you want to export must be created within a region of this location type.

## Installing the Chart

By default, Zenko NFS does not install along with the rest of the Zenko charts because it is meant to be installed on all-ready running Zenko instance with the proper storage location set (see prerequistes). Also, buckets that you want to export have to pre-exist and have the export attribute set.

To install the chart, set `zenko-nfs.enabled` to `true` in `../charts/zenko/values.yaml` like this:

```yaml
...
zenko-nfs:
    enabled: true
...
```

Then run the following commands (assuming your release name is `zenko`) from the charts subdirectory.

```bash
helm dependency build ./zenko
helm upgrade zenko ./zenko
```

After this, it will take a few seconds for the Zenko NFS pod to be up and runnning. You can check the status by running

```bash
kubectl get pods
```

When it is done, you will need to exec into the `zenko-nfsd` container running in the Zenko NFS pod by executing this command:

```bash
kubectl exec -ti POD_NAME -c zenko-nfsd bash
```

Once inside the conatiner, run the following command to set the export attribute on the bucket you want to export.

```bash
./scripts/docker-entrypoint.sh ./scripts/bucket_export_attribute.sh -s foo
```

Next, exit the container and append export configuration to `nfsd.conf`. Here is an example of minimal configuration to export the `foo` bucket.

```conf
EXPORT
{
    Export_Id = 42;
    Path = /foo;
    Pseudo = /foo;
    Access_Type = RW;
    Anonymous_uid = 1000;
    Anonymous_gid = 1000;
    Protocols = 3, 4, 9p;
    Squash = No_root_squash;
    FSAL {
        Name = "SCALITY";
        bucket = "foo";
        prefix = "";
        umask = 02;
    }
}
```

> **Tip**: A example with detailed configuration paramters can be found in the same file.

Again, from with the charts directory (parent of zenko-nfs chart), run the following commands (assuming your release name is `zenko`).

```bash
helm dependency build ./zenko
helm upgrade zenko ./zenko
```

At this point, you should be able to mount the export into a local directory.

```bash
sudo mkdir /bar
sudo mount 10.233.61.207:/foo /bar
```

Put an object through Zenko using AWS CLI (or any other compatible tool).

```bash
echo "42" > file.txt
aws --endpoint http://zenko.local s3 cp ./file.txt s3://foo
```

And read it from the local mount.

```bash
$ cat /bar/file.txt
42
```

Likewise, you can perform CRUD operations the other way around.

Create a file on the nfs mount.

```bash
echo "toto" > /bar/text.txt
```

And you will be able to access it from Zenko.

```bash
$ aws --endpoint http://zenko.local s3 ls s3://foo
TODO: put output
```

const REPLICA_SET_HOSTS = `${process.env.ZENKO_HELM_RELEASE}-mongodb-replicaset-0.` +
    `${process.env.ZENKO_HELM_RELEASE}-mongodb-replicaset:27017,` +
    `${process.env.ZENKO_HELM_RELEASE}-mongodb-replicaset-1.` +
    `${process.env.ZENKO_HELM_RELEASE}-mongodb-replicaset:27017,` +
    `${process.env.ZENKO_HELM_RELEASE}-mongodb-replicaset-2.` +
    `${process.env.ZENKO_HELM_RELEASE}-mongodb-replicaset:27017`;
const WRITE_CONCERN = "majority";
const REPLICA_SET = "rs0";
const READ_PREFERENCE = "primary";
const DATABASE = "metadata";
const CONNECT_TIMEOUT_MS = 5000;

class MongoClientInterface {
    constructor() {
        this.mongoUrl = `mongodb://${REPLICA_SET_HOSTS}/?w=${WRITE_CONCERN}&` +
            `replicaSet=${REPLICA_SET}&readPreference=${READ_PREFERENCE}`;
        this.client = null;
        this.db = null;
        this.database = DATABASE;
    }

    setup(cb) {
        // FIXME: constructors shall not have side effect so there
        // should be an async_init(cb) method in the wrapper to
        // initialize this backend
        const options = { connectTimeoutMS: CONNECT_TIMEOUT_MS };
        return MongoClient.connect(this.mongoUrl, options, (err, client) => {
            if (err) {
                return cb(errors.InternalError);
            }
            this.client = client;
            this.db = client.db(this.database, {
                ignoreUndefined: true,
            });
            return cb();
        });
    }

    getCollection(name) {
        return this.db.collection(name);
    }

    getObject(bucketName, objName, cb) {
        const c = this.getCollection(bucketName);
        // if (params && params.versionId) {
        //     // eslint-disable-next-line
        //     objName = formatVersionKey(objName, params.versionId);
        // }
        c.findOne({
            _id: objName,
        }, {}, (err, doc) => {
            if (err) {
                return cb(errors.InternalError);
            }
            if (!doc) {
                return cb(errors.NoSuchKey);
            }
            // if (doc.value.isPHD) {
            //     this.getLatestVersion(c, objName, log, (err, value) => {
            //         if (err) {
            //             log.error('getLatestVersion: getting latest version',
            //             { error: err.message });
            //             return cb(err);
            //         }
            //         return cb(null, value);
            //     });
            //     return undefined;
            // }
            return cb(null, doc.value);
        });
    }

}

module.exports = MongoClientInterface;
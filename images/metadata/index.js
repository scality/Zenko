const arsenal = require('arsenal');
const werelogs = require('werelogs');
const levelup = require('levelup');
const mongoDown = require('mongodown');
const diskusage = require('diskusage');

const WGM =
    require(
        './node_modules/arsenal/lib/versioning/WriteGatheringManager.js');
const WriteCache =
    require(
        './node_modules/arsenal/lib/versioning/WriteCache.js');
const VRP =
    require(
        './node_modules/arsenal/lib/versioning/VersioningRequestProcessor.js');

const SUBLEVEL_SEP = '::';
const SYNC_OPTIONS = { sync: true };

const listenAddr = process.env.LISTEN_ADDR ?
    process.env.LISTEN_ADDR : '0.0.0.0';
const listenPort = process.env.LISTEN_PORT ?
    process.env.LISTEN_PORT : 9990;
const mongoHost = process.env.MONGO_HOST ?
    process.env.MONGO_HOST : 'localhost';
const mongoPort = process.env.MONGO_PORT ?
    process.env.MONGO_PORT : 27017;
const mongoPath = process.env.MONGO_PATH ?
    process.env.MONGO_PATH : 'metaData';
const _restEnabled = process.env.REST_ENABLED ?
    process.env.REST_ENABLED : false;
const _restPort = process.env.REST_PORT ?
    process.env.REST_PORT : 9999;
const _recordLogEnabled = process.env.RECORD_LOG_ENABLED ?
    process.env.RECORD_LOG_ENABLED : false;
const _recordLogName = process.env.RECORD_LOG_NAME ?
    process.env.RECORD_LOG_NAME : 's3-recordlog';
const _replicationGroupId = process.env.REPLICATION_GROUP_ID ?
    process.env.REPLICATION_GROUP_ID : 'RG001';
const _logLevel = process.env.LOG_LEVEL ?
    process.env.LOG_LEVEL : 'debug';
const _dumpLevel = process.env.DUMP_LEVEL ?
    process.env.DUMP_LEVEL : 'error';

const mongoUri = `mongodb://${mongoHost}:${mongoPort}/${mongoPath}`;

const logOptions = {
    logLevel: _logLevel,
    dumpLevel: _dumpLevel,
};

const _logger = new werelogs.Logger('MDMongo');

_logger.info(`connecting to ${mongoUri}`);

const MetadataFileServer =
    arsenal.storage.metadata.MetadataFileServer;

const mdServer = new MetadataFileServer({
    bindAddress: listenAddr,
    port: listenPort,
    path: '/tmp', // unused
    restEnabled: _restEnabled,
    restPort: _restPort, // unused
    recordLog: { enabled: _recordLogEnabled,
                 recordLogName: _recordLogName },
    versioning: { replicationGroupId: _replicationGroupId },
    log: logOptions,
});

class MDMongoService extends arsenal.network.rpc.BaseService {
    constructor(params) {
        super(params);
        this.addRequestInfoConsumer((dbService, reqParams) => {
            const env = {};
            env.subLevel = reqParams.subLevel;
            return env;
        });
    }
}

const dbs = {};

function getDb(dbName) {
    if (dbs[dbName] === undefined) {
        dbs[dbName] =
            levelup(mongoUri,
                    { db: mongoDown, collection: dbName });
    }
    return dbs[dbName];
}

mdServer.initMetadataService = function init() {
    const dbService = new MDMongoService({
        namespace: '/MDFile/metadata',
        logger: _logger,
    });

    this.services.push(dbService);

    /* provide an API compatible with MetaData API */
    const metadataAPI = {
        get: (request, logger, callback) => {
            const dbName = request.db;
            const db = getDb(dbName);
            db.get(request.key, (err, value) => {
                if (err && err.notFound) {
                    return callback(arsenal.errors.ObjNotFound);
                }
                return callback(err, value);
            });
        },
        list: (request, logger, callback) => {
            const dbName = request.db;
            const db = getDb(dbName);
            const stream = db.createReadStream(request.params);
            const res = [];
            let done = false;
            stream.on('data', data => res.push(data));
            stream.on('error', err => {
                if (done === false) {
                    done = true;
                    callback(err);
                }
            });
            stream.on('end', () => {
                if (done === false) {
                    done = true;
                    callback(null, res);
                }
            });
        },
        batch: (request, logger, callback) => {
            const dbName = request.db;
            const db = getDb(dbName);
            const ops = request.array.map(
                op => Object.assign({}, op, { prefix: dbName }));
            db.batch(ops, SYNC_OPTIONS,
                     err => callback(err));
        },
    };

    Object.keys(metadataAPI).forEach(k => {
        metadataAPI[k] = metadataAPI[k].bind(dbService);
    });

    const wgm = new WGM(metadataAPI);
    const writeCache = new WriteCache(wgm);
    const vrp = new VRP(writeCache, wgm, this.versioning);

    dbService.registerAsyncAPI({
        put: (env, key, value, options, cb) => {
            const dbName = env.subLevel.join(SUBLEVEL_SEP);
            vrp.put({ db: dbName, key, value, options },
                    env.requestLogger, cb);
        },
        del: (env, key, options, cb) => {
            const dbName = env.subLevel.join(SUBLEVEL_SEP);
            vrp.del({ db: dbName, key, options },
                    env.requestLogger, cb);
        },
        get: (env, key, options, cb) => {
            const dbName = env.subLevel.join(SUBLEVEL_SEP);
            vrp.get({ db: dbName, key, options },
                    env.requestLogger, cb);
        },
        getDiskUsage: (env, cb) => diskusage.check(this.path, cb),
    });
    dbService.registerSyncAPI({
        createReadStream:
        (env, options) => {
            const dbName = env.subLevel.join(SUBLEVEL_SEP);
            const db = getDb(dbName);
            return db.createReadStream(options);
        },
        rawListKeys:
        (env, options) => {
            const dbName = env.subLevel.join(SUBLEVEL_SEP);
            const db = getDb(dbName);
            return db.createKeyStream(options);
        },
        getUUID: () => this.readUUID(),
    });

    _logger.info('Hooks installed');
};
mdServer.startServer();
_logger.info('Zenko MD MongoDB Plugin Initialized');

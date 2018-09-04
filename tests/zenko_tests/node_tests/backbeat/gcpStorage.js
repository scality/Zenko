const Storage = require('@google-cloud/storage');

const storage = new Storage({
    keyFilename: `${process.cwd()}/gcp_key.json`,
});

module.exports = storage;

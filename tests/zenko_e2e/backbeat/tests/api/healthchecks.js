const assert = require('assert');

const { makeGETRequest, getResponseBody } = require('../../utils/request');

const REPLICATION_TIMEOUT = 300000;

describe('Backbeat healthchecks', function dF() {
    this.timeout(REPLICATION_TIMEOUT);

    it('should get a 200 success response with details on internals', done => {
        makeGETRequest('/_/backbeat/api/healthcheck', (err, res) => {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            getResponseBody(res, (err, body) => {
                assert.ifError(err);

                assert(body.topics);
                Object.keys(body.topics).forEach(topic => {
                    assert(Array.isArray(body.topics[topic].partitions));
                });

                assert(body.internalConnections);
                const internals = ['isrHealth', 'zookeeper', 'kafkaProducer'];
                Object.keys(body.internalConnections).forEach(prop => {
                    assert(internals.includes(prop));
                    if (body.internalConnections[prop].status) {
                        const status = body.internalConnections[prop].status;
                        assert.strictEqual(status, 'ok');
                    }
                });

                const zkDetails = body.internalConnections.zookeeper.details;
                assert.strictEqual(zkDetails.name, 'SYNC_CONNECTED');
                done();
            });
        });
    });
});

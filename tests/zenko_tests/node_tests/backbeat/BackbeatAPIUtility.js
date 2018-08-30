const assert = require('assert');
const { makeGETRequest, makePOSTRequest, getResponseBody } =
    require('../utils/request');

class BackbeatAPIUtility {
    getReplicationStatus(locationName, cb) {
        let path = '/_/backbeat/api/crr/status';
        if (locationName) {
            path = `${path}/${locationName}`;
        }
        makeGETRequest(path, (err, res) => {
            assert.ifError(err);
            getResponseBody(res, cb);
        });
    }

    getReplicationResumeSchedule(locationName, cb) {
        const path = `/_/backbeat/api/crr/resume/${locationName}`;
        makeGETRequest(path, (err, res) => {
            assert.ifError(err);
            getResponseBody(res, cb);
        });
    }

    pauseReplication(locationName, cb) {
        let path = '/_/backbeat/api/crr/pause';
        if (locationName) {
            path = `${path}/${locationName}`;
        }
        makePOSTRequest(path, '{}', cb);
    }

    resumeReplication(locationName, schedule, hoursScheduled, cb) {
        let path = '/_/backbeat/api/crr/resume';
        let requestBody;
        if (locationName && (schedule === false)) {
            path = `${path}/${locationName}`;
        }
        else if (locationName && hoursScheduled) {
            path = `${path}/${locationName}/schedule`;
            requestBody = JSON.stringify({ hours: hoursScheduled });
        }
        makePOSTRequest(path, requestBody, cb);
    }
}

module.exports = BackbeatAPIUtility;

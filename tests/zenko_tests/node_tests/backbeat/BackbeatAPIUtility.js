const assert = require('assert');
const { makeGETRequest, makeUpdateRequest, getResponseBody } = require('../utils/request');

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
        makeUpdateRequest(path, cb, null, '{}', 'POST');
    }

    resumeReplication(locationName, schedule, hoursScheduled, cb) {
        let path = '/_/backbeat/api/crr/resume';
        let requestBody;
        if (locationName && (schedule === false)) {
            path = `${path}/${locationName}`;
        } else if (locationName && hoursScheduled) {
            path = `${path}/${locationName}/schedule`;
            requestBody = JSON.stringify({ hours: hoursScheduled });
        }
        makeUpdateRequest(path, cb, null, requestBody, 'POST');
    }

    getIngestionStatus(locationName, cb) {
        let path = '/_/backbeat/api/ingestion/status';
        if (locationName) {
            path = `${path}/${locationName}`;
        }
        makeGETRequest(path, (err, res) => {
            assert.ifError(err);
            getResponseBody(res, cb);
        });
    }

    getIngestionResumeSchedule(locationName, cb) {
        const path = `/_/backbeat/api/ingestion/resume/${locationName}`;
        makeGETRequest(path, (err, res) => {
            assert.ifError(err);
            getResponseBody(res, cb);
        });
    }

    pauseIngestion(locationName, cb) {
        let path = '/_/backbeat/api/ingestion/pause';
        if (locationName) {
            path = `${path}/${locationName}`;
        }
        makeUpdateRequest(path, cb, null, '{}', 'POST');
    }

    resumeIngestion(locationName, schedule, hoursScheduled, cb) {
        let path = '/_/backbeat/api/ingestion/resume';
        let requestBody;
        if (locationName && (schedule === false)) {
            path = `${path}/${locationName}`;
        } else if (locationName && hoursScheduled) {
            path = `${path}/${locationName}/schedule`;
            requestBody = JSON.stringify({ hours: hoursScheduled });
        }
        return makeUpdateRequest(path, (err, res) => {
            assert.ifError(err);
            return getResponseBody(res, cb);
        }, null, requestBody, 'POST');
    }
}

module.exports = BackbeatAPIUtility;

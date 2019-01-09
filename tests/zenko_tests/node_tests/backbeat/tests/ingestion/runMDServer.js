const http = require('http');
const { MetadataMock } = require('./MockMDServer');
const MDPORT = 9000;

const metadataMock = new MetadataMock();
const httpServer = http.createServer(
    (req, res) => metadataMock.onRequest(req, res)).listen(MDPORT);

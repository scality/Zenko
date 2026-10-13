module.exports = {
    reporterEnabled: 'spec, xunit',
    xunitReporterOptions: {
        output: process.env.MOCHA_FILE || '_reports/test-results.xml',
    },
};

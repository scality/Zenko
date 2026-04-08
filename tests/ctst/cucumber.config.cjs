// In CI, make cucumber-js exit 0 on test failures so that infrastructure
// errors still propagate while test results are evaluated via JUnit reports.
if (process.env.CI_PASS_ON_TEST_FAILURE === 'true') {
    const _exit = process.exit;
    process.exit = function exit(code) {
        _exit(code === 1 ? 0 : code);
    };
}

module.exports = {
    default: {
        requireModule: ['ts-node/register', 'tsconfig-paths/register'],
        require: ['steps/**/*.ts', 'common/**/*.ts', 'world/**/*.ts'],
        paths: ['features/**/*.feature'],
        format: [
            'pretty',
            'json:reports/cucumber-report.json',
            'html:reports/report.html',
        ],
        parallel: 4,
    },
};

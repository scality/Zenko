// In CI, make cucumber-js exit 0 on test failures so that infrastructure
// errors still propagate while test results are evaluated via JUnit reports.
// Cucumber-js v12 sets `process.exitCode = 1` on normal test failures and only
// calls `process.exit(1)` when it needs to force-exit (e.g. dangling handles),
// so we must intercept both paths.
if (process.env.CI_PASS_ON_TEST_FAILURE === 'true') {
    const _exit = process.exit;
    process.exit = function exit(code) {
        _exit(code === 1 ? 0 : code);
    };
    process.on('beforeExit', () => {
        if (process.exitCode === 1) {
            process.exitCode = 0;
        }
    });
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
            'junit:reports/report.xml',
        ],
        parallel: 4,
    },
};

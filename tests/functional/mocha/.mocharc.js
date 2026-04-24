// Allow CI to make mocha exit 0 on test failures, so that infrastructure
// errors still propagate while test results are evaluated via JUnit reports.
module.exports = {
    'pass-on-failing-test-suite': process.env.CI_PASS_ON_TEST_FAILURE === 'true',
    'exit': true,
    'reporter': 'mocha-multi-reporters',
    'reporter-options': 'configFile=mocha/mocha-reporter.json',
};

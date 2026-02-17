
module.exports = {
    default: {
        requireModule: ['ts-node/register', 'tsconfig-paths/register'],
        require: ['steps/**/*.ts', 'common/**/*.ts', 'world/**/*.ts'],
        paths: ['features/**/*.feature'],
        format: [
            'progress-bar',
            '@cucumber/pretty-formatter',
            'json:reports/cucumber-report.json',
            'html:reports/report.html',
        ],
        parallel: 4,
    },
};


module.exports = {
    default: {
        requireModule: ['ts-node/register', 'tsconfig-paths/register'],
        require: ['steps/**/*.ts', 'common/**/*.ts', 'world/**/*.ts'],
        paths: ['features/**/*.feature'],
        format: [
            'progress-bar',
            'pretty',
            'json:reports/cucumber-report.json',
            'html:reports/report.html',
        ],
        parallel: 4,
    },
};

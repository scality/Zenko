
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

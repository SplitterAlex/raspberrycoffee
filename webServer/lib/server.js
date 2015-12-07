var npmPackage,
    restify,
    fs;

npmPackage = require('../package.json');
restify = require('restify');
serverDefinitions = require('../config/config.json');
log = require('./log');
restifyValidation = require('node-restify-validation');

module.exports = {
    create: function () {
        var options, server;
        options = {
            name: npmPackage.name,
            version: npmPackage.version
        };
        server = restify.createServer(options);
        server.use(restify.acceptParser(server.acceptable));
        server.use(restify.queryParser());
        server.use(restify.bodyParser());
        server.use(restify.dateParser());
        server.use(restify.gzipResponse());
        server.use(restify.fullResponse());
        server.use(restify.authorizationParser());
        server.use(restifyValidation.validationPlugin({
            errorsAsArray: true,
            forbidUndefinedVariables: false
        }));
        server.pre(restify.pre.sanitizePath());
        server.pre(restify.pre.userAgentConnection());

        log.init(serverDefinitions.log4js);

        require('../routes/pi/authentication').apply(server);
        require('../routes/pi/addBooking').apply(server);

        // get-'/tokenPing
        require('../routes/auth/tokenPing').apply(server);
        require('../routes/auth/signIn').apply(server);
        require('../routes/auth/signUp').apply(server);

        require('../routes/admin/transactions').apply(server);

        require('../routes/api/userGroups').apply(server);

        require('../routes/user/user').apply(server);
        require('../routes/user/changePassword').apply(server);
        require('../routes/user/key').apply(server);
        require('../routes/user/newTransaction').apply(server);
        require('../routes/user/getTransactions').apply(server);
        require('../routes/user/mail').apply(server);
        require('../routes/user/dashboard').apply(server);

        require('../routes/api/transactionPurposes').apply(server);
        require('../routes/api/defaultNotes').apply(server);

        require('../routes/statistics/coffeeConsumption').apply(server);

        require('../routes/statistics/rankings').apply(server);
        
        require('../routes/statistics/monthStatistic').apply(server);

        require('../routes/statistics/weekStatistic').apply(server);

        require('../routes/statistics/dayStatistic').apply(server);

        require('../routes/statistics/customRange').apply(server);


        return server;
    }
};
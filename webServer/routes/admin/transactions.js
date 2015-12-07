var restify = require('restify'),
    jwtOptions = require('../../config/config.json').jwt,
    restifyJwt = require('restify-jwt'),
    constants = require('../../lib/constants'),
    utils = require('../../lib/utils'),
    logging = require('../../lib/commonHandlers').userLogging;

var simpleQueryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/admin/transactions',
            validation: {
                queries: {
                    startDate: {
                        isRequired: false,
                        regex: constants.DATE_REGEX
                    },
                    endDate: {
                        isRequired: false,
                        regex: constants.DATE_REGEX
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }
            //check here if we have to show the last 200 transactions or from a date range
            var error = utils.isCorrectDateRange(req.params.startDate, req.params.endDate);
            if (typeof error !== 'number') {
                return next(new restify.BadRequestError(error));
            }
            
            simpleQueryExecutors.getGlobalTransactions(req.params.startDate, req.params.endDate)
            .then(function (result) {
                res.send(result);
                next();
            }, function (err) {
                next(err);
            });
        }, logging);
    }
};
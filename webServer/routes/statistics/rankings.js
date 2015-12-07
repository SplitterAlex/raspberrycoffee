var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    async = require('async'),
    logging = require('../../lib/commonHandlers').userLogging,
    restify = require('restify'),
    constants = require('../../lib/constants');

var simpleQueryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/statistics/rankings/:for',
            validation: {
                resources: {
                  for: {
                      isRequired: true,
                      isIn: ['users', 'groups']
                  }  
                },
                queries: {
                    fromYear: {
                        isRequired: false,
                        regex: constants.YEAR_REGEX
                    },
                    fromMonth: {
                        isRequired: false,
                        regex: constants.MONTH_REGEX
                    },
                    fromGroup: {
                        isRequired: false,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (req.params.fromMonth && !req.params.fromYear) {
                return next(new restify.BadRequestError('Query fromYear is missing'));
            }
            
            simpleQueryExecutors.getTop10Rankings(req.params.fromGroup, req.params.fromYear, req.params.fromMonth, req.params.for)
            .then(function (result) {
                res.send(result);
                next();
            }, function (err) {
                return next(err);
            })
        }, logging);
    }
};
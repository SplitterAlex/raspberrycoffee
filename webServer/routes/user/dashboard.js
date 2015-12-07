var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    async = require('async'),
    constants = require('../../lib/constants'),
    logging = require('../../lib/commonHandlers').userLogging,
    authorization = require('../../lib/commonHandlers').authorization,
    utils = require('../../lib/utils'),
    moment = require('moment');


var simpleQueryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/user/:id/dashboard',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                queries: {
                    groupId: {
                        isRequired: false,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            var groupId = (typeof req.params.groupId === 'undefined' || req.params.groupId === '') ? 0 : parseInt(req.params.groupId);
            var userId = parseInt(req.params.id);

            async.series({

                globalRankingPlace: function (callback) {
                    simpleQueryExecutors.getRankingPlace(userId)
                    .then(function (result) {
                        callback(null, result[0].rank + '/' + result[0].challengers);
                    }, function (err) {
                        callback(err);
                    });
                },

                groupRankingPlace: function (callback) {
                    if (!groupId) {
                        return callback(null, 'N/A');
                    }
                    simpleQueryExecutors.getRankingPlace(userId, groupId)
                    .then(function (result) {
                        callback(null, result[0].rank + '/' + result[0].challengers);
                    }, function (err) {
                        callback(err);
                    });
                },

                investedMoney: function (callback) {
                    simpleQueryExecutors.query({
                        sql: 'SELECT COALESCE(SUM(amount),0) as investedMoney FROM transactions WHERE toDepositor=? AND NOT (purposeId=? OR purposeId=?)',
                        args: [userId, constants.CREDIT, constants.DEBIT]
                    })
                    .then(function (result) {
                        callback(null, parseFloat(Math.round(Math.abs(result[0].investedMoney) * 100) / 100).toFixed(2));
                    }, function(err) {
                        callback(err);
                    });
                },

                count: function (callback) {
                    
                    simpleQueryExecutors
                    .getCoffeeCounters(userId, groupId)
                    .then(function (result) {
                        var counts = {
                            global: result[0][0].counter,
                            group: result[1][0].counter,
                            user: result[2][0].counter
                        }
                        callback(null, counts);
                    }, function (err) {
                        callback(err);
                    });
                },

                mcc: function (callback) {
                    simpleQueryExecutors.getMaxCoffeeConsumption(userId, groupId, moment().format('YYYY-MM-DD'))
                    .then(function (result) {
                        callback(null, utils.processResultAndBeautifyDatesForGlobalAndCurrentCC(result));
                    }, function (err) {
                        callback(err);
                    })
                },

                ccc: function (callback) {
                    var today = moment().format('YYYY-MM-DD');
                    simpleQueryExecutors.getCurrentCoffeeConsumption(userId, groupId, today)
                    .then(function (result) {
                        callback(null, utils.processResultAndBeautifyDatesForGlobalAndCurrentCC(result));
                    }, function (err) {
                        callback(err);
                    })
                }

            }, function (err, results) {
                if (err) {
                    return next(err);
                }
                res.send(results);
                next();
            });
        }, logging);
    }
};
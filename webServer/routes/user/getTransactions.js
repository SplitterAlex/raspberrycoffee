var jwtOptions = (require('../../config/config.json')).jwt,
    restify = require('restify'),
    restifyJwt = require('restify-jwt'),
    logging = require('../../lib/commonHandlers').userLogging,
    authorization = require('../../lib/commonHandlers').authorization,
    utils = require('../../lib/utils'),
    constants = require('../../lib/constants');

var queryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/user/:id/transaction/:pos/',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    },
                    pos: {
                        isRequired: true,
                        isNumeric: true,
                        min: 0
                    }
                },
                queries: {
                    endDate: {
                        isRequired: true,
                        regex: constants.DATE_REGEX
                    },
                    startDate: {
                        isRequired: true,
                        regex: constants.DATE_REGEX
                    },
                    key: {
                        isRequired: false,
                        multiple: true,
                        regex: constants.KEY_REGEX
                    },
                    purpose: {
                        isRequired: false,
                        multiple: true,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {


            var filter = '';
            
            var error = utils.isCorrectDateRange(req.params.startDate, req.params.endDate);
            if (typeof error !== 'number') {
                return next(new restify.BadRequestError(error));
            }

            if (req.params.key) {
                var keyFilter = ' AND ('
                var c = 't.nfcKey='
                var keys = req.params.key;
                if (Object.prototype.toString.call(keys) === '[object Array]') {
                    for (var i = 0; i < keys.length; i++) {
                        if (i == 0) {
                            keyFilter = keyFilter + c + '"' + keys[i] + '"';
                            continue;
                        }
                        keyFilter = keyFilter + ' OR ' + c + '"' + keys[i] + '"';
                    }
                } else {
                    keyFilter = keyFilter + c + '"' + keys + '"';
                }
                keyFilter = keyFilter + ')';
                filter = filter + keyFilter;

            }

            if (req.params.purpose) {
                var purposeFilter = ' AND (';
                var c = 't.purposeId=' //column name
                var ids = req.params.purpose;

                if (Object.prototype.toString.call(ids) === '[object Array]') {
                    for (var i = 0; i < ids.length; i++) {
                        if (i == 0) {
                            purposeFilter = purposeFilter + c + ids[i];
                            continue;
                        }
                        purposeFilter = purposeFilter + ' OR ' + c + ids[i];
                    }
                } else {
                    purposeFilter = purposeFilter + c + ids;
                }
                purposeFilter = purposeFilter + ')';
                filter = filter + purposeFilter;
            }

            //console.log('FILTER: ' + filter);

            queryExecutors
            .getTransactionsFromUser(
                [
                    req.params.id,
                    req.params.startDate,
                    req.params.endDate,
                    parseInt(req.params.pos)
                ], filter)
            .then(function (result) {
                res.send(200, result);
                next();
            }, function (err) {
                next(err);
            })
            
        }, logging);

    }
};
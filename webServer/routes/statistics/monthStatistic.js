var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    restify = require('restify'),
    logging = require('../../lib/commonHandlers').userLogging,
    constants = require('../../lib/constants');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez'];

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/statistics/monthly',
            validation: {
                queries: {
                    fromMainYear: {
                        isRequired: true,
                        regex: constants.YEAR_REGEX
                    },
                    fromSecondYear: {
                        isRequired: true,
                        regex: constants.YEAR_REGEX
                    },
                    fromGroup: {
                        isRequired: false,
                        isNumeric: true
                    },
                    fromUser: {
                        isRequired: false,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (req.params.fromUser) {
                if (req.user.userId !== parseInt(req.params.fromUser)) {
                    if (!req.user.isAdmin) {
                        return next(new restify.UnauthorizedError('Permission Denied'));
                    }
                }
            }

            if (req.params.fromMainYear == req.params.fromSecondYear) {
                return next(new restify.BadRequestError('fromMainYear and fromSecondYear are equal'));
            }

            simpleQueryExecutors.getMonthStatistics(req.params.fromGroup, req.params.fromUser, req.params.fromMainYear, req.params.fromSecondYear)
                .then(function (result) {
                    try {
                        var data = {
                            data: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
                            labels: months,
                            series: [req.params.fromMainYear, req.params.fromSecondYear]
                        };

                        for (var i = 0; i < result.length; i++) {
                            var e = result[i];
                            if (req.params.fromMainYear == e.year) {
                                data.data[0][e.month - 1] = e.data;
                            } else {
                                data.data[1][e.month - 1] = e.data;
                            }
                        };

                        res.send(data);
                        next();
                    } catch (e) {
                        return next(new restify.InternalServerError(e.message));
                    }
                }, function (err) {
                    return next(err);
                })
        }, logging);
    }
};
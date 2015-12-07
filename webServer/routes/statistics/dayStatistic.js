var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    async = require('async'),
    logging = require('../../lib/commonHandlers').userLogging,
    restify = require('restify'),
    constants = require('../../lib/constants');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();

var hours = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
             '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/statistics/daily',
            validation: {
                queries: {
                    fromMainDay: {
                        isRequired: true,
                        regex: constants.DATE_REGEX
                    },
                    fromSecondDay: {
                        isRequired: true,
                        regex: constants.DATE_REGEX
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

            if (req.params.fromMainDay === req.params.fromSecondDay) {
                return next(new restify.BadRequestError('fromMainDay and fromSecondDay are equal'));
            }

            simpleQueryExecutors.getDayStatistics(req.params.fromGroup, req.params.fromUser, req.params.fromMainDay, req.params.fromSecondDay)
                .then(function (results) {
                    try {
                        var data = results;
                        var dayRev = {
                            labels: hours,
                            series: [req.params.fromMainDay, req.params.fromSecondDay],
                            data: [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                ]
                        }

                        for (var i = 0; i < data.length; i++) {
                            var e = data[i];
                            if (e.date == req.params.fromMainDay) {
                                dayRev.data[0][e.hour] = e.total;
                            }else {
                                dayRev.data[1][e.hour] = e.total;
                            }
                        }
                        res.send(dayRev);
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
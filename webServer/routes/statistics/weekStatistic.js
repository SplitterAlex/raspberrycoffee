var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    async = require('async'),
    restify = require('restify'),
    moment = require('moment'),
    logging = require('../../lib/commonHandlers').userLogging,
    constants = require('../../lib/constants');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/statistics/weekly',
            validation: {
                queries: {
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

            var momentObjStart = moment().set({
                'hour': 0,
                'minute': 0,
                'second': 0
            });
            var momentObjEnd = moment().set({
                'hour': 23,
                'minute': 59,
                'second': 59
            });;

            simpleQueryExecutors.getWeekStatistics(
                    req.params.fromGroup,
                    req.params.fromUser,
                    momentObjStart.subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
                    momentObjEnd.format('YYYY-MM-DD HH:mm:ss'),
                    momentObjStart.subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
                    momentObjEnd.subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss')
                )
                .then(function (result) {
                    try {

                        var thisWeek = result[0];
                        var lastWeek = result[1];

                        var currWeekObj = moment();
                        var lastWeekObj = moment().subtract(1, 'week');
                        //lastDate = new Date(lastDate.setDate(lastDate.getDate() - 7));

                        var labelsDayMapThisWeek = {};
                        var labelsDayMapLastWeek = {};

                        var weekRev = {
                            labels: [],
                            series: ['this week (*)', 'last week (*)', 'this week (**)', 'last week (**))'],
                            dataIndexMap: ['Total', 'Coffee', 'Espresso', 'Latte', 'Cappuccino'],
                            data: {}
                        }

                        for (var i = 6; i >= 0; i--) {
                            if (i == 6) {
                                weekRev.labels[i] = 'Today';
                            } else {
                                currWeekObj.subtract(1, 'days');
                                lastWeekObj.subtract(1, 'days');

                                if (i < 5) {
                                    weekRev.labels[i] = currWeekObj.format('dddd');
                                } else {
                                    weekRev.labels[i] = 'Yesterday';
                                }
                            }
                            labelsDayMapThisWeek[currWeekObj.format('D')] = i;
                            labelsDayMapLastWeek[lastWeekObj.format('D')] = i;
                        }
                        //console.log(weekRev.labels);
                        //console.log(labelsDayMapThisWeek);
                        //console.log(labelsDayMapLastWeek);

                        weekRev.data['Total'] = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
                        weekRev.data['Coffee'] = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
                        weekRev.data['Espresso'] = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
                        weekRev.data['Latte'] = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
                        weekRev.data['Cappuccino'] = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];

                        for (var i = 0, len = thisWeek.length; i < len; ++i) {
                            var e = thisWeek[i];
                            if (e.purposeId === constants.COFFEE_LARGE) {
                                weekRev.data['Coffee'][0][labelsDayMapThisWeek[e.dayNumber]] += (e.purposeCount * 2);
                                weekRev.data['Total'][0][labelsDayMapThisWeek[e.dayNumber]] += (e.purposeCount * 2);
                                continue;
                            } else if (e.purposeId === constants.ESPRESSO_LARGE) {
                                weekRev.data['Espresso'][0][labelsDayMapThisWeek[e.dayNumber]] += (e.purposeCount * 2);
                                weekRev.data['Total'][0][labelsDayMapThisWeek[e.dayNumber]] += (e.purposeCount * 2);
                                continue;
                            }
                            weekRev.data[e.name][0][labelsDayMapThisWeek[e.dayNumber]] += e.purposeCount;
                            weekRev.data['Total'][0][labelsDayMapThisWeek[e.dayNumber]] += e.purposeCount;
                        }

                        for (var i = 0, len = lastWeek.length; i < len; ++i) {
                            var e = lastWeek[i];
                            //console.log(e);
                            if (e.purposeId === constants.COFFEE_LARGE) {
                                weekRev.data['Coffee'][1][labelsDayMapLastWeek[e.dayNumber]] += (e.purposeCount * 2);
                                weekRev.data['Total'][1][labelsDayMapLastWeek[e.dayNumber]] += (e.purposeCount * 2);
                                continue;
                            } else if (e.purposeId === constants.ESPRESSO_LARGE) {
                                weekRev.data['Espresso'][1][labelsDayMapLastWeek[e.dayNumber]] += (e.purposeCount * 2);
                                weekRev.data['Total'][1][labelsDayMapLastWeek[e.dayNumber]] += (e.purposeCount * 2);
                                continue;
                            }
                            weekRev.data[e.name][1][labelsDayMapLastWeek[e.dayNumber]] += e.purposeCount;
                            weekRev.data['Total'][1][labelsDayMapLastWeek[e.dayNumber]] += e.purposeCount;
                        }

                        res.send(weekRev);
                        next();
                    } catch (e) {
                        return next(new restify.InternalServerError(e.message));
                    }
                }, function (err) {
                    return next(err);
                });
        }, logging);
    }
};
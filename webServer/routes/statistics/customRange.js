var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    async = require('async'),
    restify = require('restify'),
    logging = require('../../lib/commonHandlers').userLogging,
    utils = require('../../lib/utils'),
    constants = require('../../lib/constants'),
    moment = require('moment');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/statistics/customRange',
            validation: {
                queries: {
                    endDate: {
                        isRequired: true,
                        regex: constants.DATE_REGEX
                    },
                    startDate: {
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

            var dateDiff = utils.isCorrectDateRange(req.params.startDate, req.params.endDate, 31);
            if (typeof dateDiff !== 'number') {
                return next(new restify.BadRequestError(dateDiff));
            }

            simpleQueryExecutors.getCustomRangeStatistics(req.params.fromGroup, req.params.fromUser, req.params.startDate, req.params.endDate)
                .then(function (results) {
                    try {
                        var data = results;
                        var dateIndexMap = [];

                        var rangeRev = {
                            labels: [],
                            series: ['all coffee types', '**'],
                            dataIndexMap: ['Total', 'Coffee', 'Espresso', 'Latte', 'Cappuccino'],
                            data: {}
                        }


                        rangeRev.labels.push(moment(req.params.startDate).format('MM-DD'));
                        dateIndexMap[moment(req.params.startDate).format('MM-DD')] = 0;
                        var newDate = req.params.startDate;
                        for (var i = 1; i <= dateDiff; i++) {
                            newDate = moment(newDate).add(1, 'days');
                            rangeRev.labels.push(newDate.format('MM-DD'));
                            dateIndexMap[newDate.format('MM-DD')] = i;
                        }

                        rangeRev.data['Total'] = [];
                        rangeRev.data['Coffee'] = [];
                        rangeRev.data['Espresso'] = [];
                        rangeRev.data['Latte'] = [];
                        rangeRev.data['Cappuccino'] = [];

                        //init arrays with zeros

                        for (var i = 0; i < dateDiff + 1; i++) {
                            rangeRev.data['Total'][i] = 0;
                            rangeRev.data['Coffee'][i] = 0;
                            rangeRev.data['Espresso'][i] = 0;
                            rangeRev.data['Latte'][i] = 0;
                            rangeRev.data['Cappuccino'][i] = 0;
                        }

                        for (var i = 0, len = data.length; i < len; ++i) {
                            var e = data[i];
                            if (e.purposeId === constants.COFFEE_LARGE) {
                                rangeRev.data['Coffee'][dateIndexMap[moment(e.date).format('MM-DD')]] += (e.purposeCount * 2);
                                rangeRev.data['Total'][dateIndexMap[moment(e.date).format('MM-DD')]] += (e.purposeCount * 2);
                                continue;
                            } else if (e.purposeId === constants.ESPRESSO_LARGE) {
                                rangeRev.data['Espresso'][dateIndexMap[moment(e.date).format('MM-DD')]] += (e.purposeCount * 2);
                                rangeRev.data['Total'][dateIndexMap[moment(e.date).format('MM-DD')]] += (e.purposeCount * 2);
                                continue;
                            }
                            rangeRev.data[e.name][dateIndexMap[moment(e.date).format('MM-DD')]] += e.purposeCount;
                            rangeRev.data['Total'][dateIndexMap[moment(e.date).format('MM-DD')]] += e.purposeCount;
                        }

                        //console.log(rangeRev.data['Total']);
                        res.send(rangeRev);
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
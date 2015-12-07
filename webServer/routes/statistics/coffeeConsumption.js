var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    async = require('async'),
    logging = require('../../lib/commonHandlers').userLogging,
    constants = require('../../lib/constants'),
    utils = require('../../lib/utils'),
    moment = require('moment'),
    restify = require('restify');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();

var items = ['Coffee', 'Espresso', 'Latte', 'Cappuccino'];

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/statistics/coffeeConsumption',
            validation: {
                queries: {
                    endDate: {
                        isRequired: false,
                        regex: constants.DATE_REGEX
                    },
                    startDate: {
                        isRequired: false,
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

            //if no range is set
            var dateIsSet = !req.params.startDate && !req.params.endDate;
            if (dateIsSet) {
                req.params.startDate = '2014-01-01'
                req.params.endDate = moment().endOf('month').format('YYYY-MM-DD');
            }

            var error = utils.isCorrectDateRange(req.params.startDate, req.params.endDate);
            if (typeof error !== 'number') {
                return next(new restify.BadRequestError(error));
            }

            simpleQueryExecutors.getCoffeeConsumption(req.params.fromGroup, req.params.fromUser, req.params.startDate, req.params.endDate)
                .then(function (results) {
                    try {
                        var data = [];
                        var coffee = 0;
                        var espresso = 0;
                        for (var i = 0; i < results.length; i++) {

                            switch (results[i].id) {
                            case constants.COFFEE:
                                coffee += results[i].data;
                                break;
                            case constants.COFFEE_LARGE:
                                coffee += results[i].data * 2;
                                break;
                            case constants.ESPRESSO:
                                espresso += results[i].data;
                                break;
                            case constants.ESPRESSO_LARGE:
                                espresso += results[i].data * 2;
                                break;
                            default:
                                data.push(results[i]);
                            }
                        }
                        if (coffee != 0) {
                            data.push({
                                id: constants.COFFEE,
                                label: 'Coffee',
                                data: coffee
                            });
                        }
                        if (espresso != 0) {
                            data.push({
                                id: constants.ESPRESSO,
                                label: 'Espresso',
                                data: espresso
                            });
                        }

                        var coffeeConsumption = {
                            labels: [],
                            data: [],
                            total: 0,
                            dateRange: {
                                startDate: req.params.startDate,
                                endDate: req.params.endDate
                            }
                        };

                        if (!data.length) {
                            coffeeConsumption.labels = items;
                            coffeeConsumption.data = [0, 0, 0, 0];
                            coffeeConsumption.total = 0;
                        } else {
                            for (index = 0, len = data.length; index < len; ++index) {
                                coffeeConsumption.labels.push(data[index].label);
                                coffeeConsumption.data.push(data[index].data);
                                coffeeConsumption.total += data[index].data;
                            }
                        }
                        res.send(coffeeConsumption);
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
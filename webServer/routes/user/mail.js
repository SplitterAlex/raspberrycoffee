var jwtOptions = (require('../../config/config.json')).jwt,
    restify = require('restify'),
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    logging = require('../../lib/commonHandlers').userLogging,
    authorization = require('../../lib/commonHandlers').authorization,
    utils = require('../../lib/utils'),
    constants = require('../../lib/constants');

var queryExecutor = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/user/:id/emailSettings',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutor.query({
                sql: 'SELECT t.id, t.name, t.identifier, t.helpText, u.isEnabled, u.sent FROM emailNotificationTypes t INNER JOIN userEmailNotifications u ON t.id=u.notificationTypeId WHERE userId=?',
                args: req.params.id
            })
            .then(function (result) {
                if (!result.length) {
                    return next(new restify.BadRequestError('No mail settings found for user with id:' + req.params.id));
                }
                res.send(result);
                next();
            }, function (err) {
                return next(err); 
            });

        }, logging);


        server.put({
            url: '/api/user/:id/enableEmailNotification',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    enableEmailNotification: {
                        isRequired: true,
                        isBoolean: function () {
                            this.req.body.enableEmailNotification = utils.isValidBoolean(this.req.body.enableEmailNotification)
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutor.updateUserSetting([{enableEmailNotification: req.body.enableEmailNotification}, req.params.id])
            .then(function (result) {
                var message;
                if (req.body.enableEmailNotification) {
                    message = 'Email notifications enabled'
                } else {
                    message = 'Email notifications disabled'
                }
                res.send(200, {
                    message: message
                });
                next();
            }, function (err) {
                return next(err); 
            });

        }, logging);


        server.put({
            url: '/api/user/:id/emailSettings',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    },
                    value: {
                        isRequired: true,
                        isBoolean: function () {
                            this.req.body.value = utils.isValidBoolean(this.req.body.value)
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutor.query({
                sql: 'UPDATE userEmailNotifications SET isEnabled=? WHERE notificationTypeId=? AND userId=?',
                args: [req.body.value, req.body.id, req.params.id]
            })
            .then(function (result) {
                res.send(200, {message: 'Email setting successfully updated'});
                next();
            }, function (err) {
                return next(err); 
            });
        
        }, logging);

        server.put({
            url: '/api/user/:id/emailCreditLimitForNotification',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    emailCreditLimitForNotification: {
                        isRequired: true,
                        isDecimal: function () {
                            this.req.body.emailCreditLimitForNotification = utils.isDecimal(this.req.body.emailCreditLimitForNotification);
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            if (req.body.emailCreditLimitForNotification < 0) {
                return next(new restify.BadRequestError('Limit should be positiv'));
            }
            
            queryExecutor.updateUserSetting([{emailCreditLimitForNotification: req.body.emailCreditLimitForNotification}, req.params.id])
            .then(function (result) {
                res.send(200, {
                    message: 'Limit for email notification successfully updated',
                    newLimit: req.body.emailCreditLimitForNotification
                });
                queryExecutor.setSentInUserEmailNotifications(req.params.id, constants.BALANCE_LOW, false)
                .then(function (result) {
                    
                }, function (err) {
                    log.error(err);
                })
                next();
            }, function (err) {
                return next(err); 
            });
        }, logging);
    }
};
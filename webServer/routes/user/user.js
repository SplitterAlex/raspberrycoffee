var jwtOptions = (require('../../config/config.json')).jwt,
    restify = require('restify'),
    restifyJwt = require('restify-jwt'),
    async = require('async'),
    utils = require('../../lib/utils'),
    constants = require('../../lib/constants'),
    logging = require('../../lib/commonHandlers').userLogging,
    authorization = require('../../lib/commonHandlers').authorization;

var queryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get({
            url: '/api/user/:id',
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
            
            queryExecutors.getUserFromUserId(req.params.id)
            .then(function (result) {
                if (!result.length) {
                    return next(new restify.BadRequestError('No user found with id:' + req.params.id));
                }
                delete result[0].pwd;
                res.send(result[0]);
                next();
            }, function (err) {
                return next(err);
            });
        }, logging);


        server.get({
            url: '/api/user',
            validation: {
                queries: {
                    search: {
                        isRequired: false,
                        regex: constants.USERNAME_SEARCHSTRING_REGEX
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {
            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied - Admins only'));
            }

            var searchString;

            if (req.params.search) {
                searchString = '%' + req.params.search + '%';
            } else {
                searchString = '%%'
            }
            
            queryExecutors.getUsers(searchString)
            .then(function (result) {
                if (!result.length) {
                    res.send(200, []);
                } else {
                    res.send(result);
                }
                req.adminPermission = true;
                next();
            }, function (err) {
                return next(err);
            });
        }, logging);

        server.put({
            url: '/api/user/:id/isBlocked',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    isBlocked: {
                        isRequired: true,
                        isBoolean: function () {
                            this.req.body.isBlocked = utils.isValidBoolean(this.req.body.isBlocked)
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }
            
            queryExecutors.updateUserSetting([
                {isBlocked: req.body.isBlocked}, req.params.id
            ])
            .then(function (result) {
                res.send(200, {message: "Status blocked successfully updated"});
                req.adminPermission = true;
                next();
            }, function (err) {
                return next(err);
            });
        }, logging);

        server.put({
            url: '/api/user/:id/groupId',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    groupId: {
                        isRequired: true,
                        isNumeric: true,
                        min: 0
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutors.updateUserSetting([
                {groupId: req.body.groupId}, req.params.id
            ])
            .then(function (result) {
                res.send(200, {message: "Usergroup successfully updated"});
                next();
            }, function (err) {
                return next(err);
            });
        }, logging);

        server.put({
            url: '/api/user/:id/isActive',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    isActive: {
                        isRequired: true,
                        isBoolean: function () {
                            this.req.body.isActive = utils.isValidBoolean(this.req.body.isActive)
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutors.updateUserSetting([
                {isActive: req.body.isActive}, req.params.id
            ])
            .then(function (result) {
                res.send(200, {message: "Status active successfully updated"});
                next();
            }, function (err) {
                return next(err);
            });

        }, logging);

        server.put({
            url: '/api/user/:id/timeStampPrivatelySetting',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    timestampSetting: {
                        isRequired: true,
                        isIn: ['full', 'monthly', 'daily']
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutors.updateUserSetting([
                {timeStampPrivatelySetting: req.body.timestampSetting}, req.params.id
            ])
            .then(function (result) {
                res.send(200, {message: "Timestamp precision successfully updated"});
                next();
            }, function (err) {
                return next(err);
            });
            
        }, logging);

        server.put({
            url: '/api/user/:id/showNameInRanking',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    showNameInRanking: {
                        isRequired: true,
                        isBoolean: function () {
                            this.req.body.showNameInRanking = utils.isValidBoolean(this.req.body.showNameInRanking)
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutors.updateUserSetting([
                {showNameInRanking: req.body.showNameInRanking}, req.params.id
            ])
            .then(function (result) {
                
                var message = '';
                if (req.body.showNameInRanking) {
                    message = 'Your name shows up in the rankings.'
                } else {
                    message = 'Your name doesnt show up in the rankings.'
                }
                res.send(200, {message: message});
                next();
            }, function (err) {
                return next(err);
            });

        }, logging);

        server.put({
            url: '/api/user/:id/debtLimit',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    debtLimit: {
                        isRequired: true,
                        isDecimal: function () {
                            this.req.body.debtLimit = utils.isDecimal(this.req.body.debtLimit);
                        },
                        msg: 'Invalid decimal. Regard this pattern: /^[-+]?[0-9]{1,}([.,][0-9]{1,2})?$/'
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }

            if (req.body.debtLimit < 0) {
                return next(new restify.BadRequestError('Debt limit: Negativ value is not allowed'))
            }
            
            queryExecutors.updateUserSetting([
                {debtLimit: req.body.debtLimit}, req.params.id
            ])
            .then(function (result) {
                res.send(200, {message: "Debt limit successfully updated", newDebtLimit: req.body.debtLimit});
                req.adminPermission = true;
                next();
            }, function (err) {
                return next(err);
            });
        }, logging);
            
        server.del({
            url: '/api/user/:id/delete',
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
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }

            queryExecutors.updateUserSetting([
                {deleted: true}, req.params.id
            ])
            .then(function (result) {
                res.send(200, {message: "User successfully removed"});
                req.adminPermission = true;
                next();
            }, function (err) {
                return next(err);
            });

        }, logging);

    }
};
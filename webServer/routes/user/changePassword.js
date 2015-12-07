var jwtOptions = (require('../../config/config.json')).jwt,
    restify = require('restify'),
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').user,
    bcrypt = require('bcrypt'),
    async = require('async'),
    utils = require('../../lib/utils'),
    constants = require('../../lib/constants'),
    authorization = require('../../lib/commonHandlers').authorization;

var queryExecutor = new(require('../../lib/db/QueryExecutor'))();

module.exports = {

    apply: function (server) {

        server.put({
            url: '/api/user/:id/changePassword',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    currentPassword: {
                        isRequired: true,
                        is: function () {
                            var pwd = this.req.body.currentPassword;
                            if (pwd.length > constants.MAX_PASSWORD_LENGTH || pwd.length < constants.MIN_PASSWORD_LENGTH) {
                                throw 'pwd is either too short or too long';
                            }
                        }
                    },
                    newPassword: {
                        isRequired: true,
                        is: function () {
                            var pwd = this.req.body.newPassword;
                            if (pwd.length > constants.MAX_PASSWORD_LENGTH || pwd.length < constants.MIN_PASSWORD_LENGTH) {
                                throw 'pwd is either too short or too long';
                            }
                        },
                        msg: 'New password is either too short or too long'
                    },
                    username: {
                        isRequired: true,
                        regex: constants.USERNAME_REGEX
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {

            var route = '[' + req.method + '=' + req.url + ']';
            if ((req.params.id != req.user.userId) && (req.user.isAdmin)) {
                log.info(route + ' entered from Admin with id ' + req.user.userId);
            } else {
                log.info(route + ' entered from User with id ' + req.user.userId);
            }

            async.waterfall([

            function (callback) {

                    queryExecutor.query({
                            sql: 'SELECT userId, username, pwd, ldapAuth, deleted FROM users WHERE userId=?',
                            args: req.params.id
                        })
                        .then(function (result) {
                            if (!result.length) {
                                return callback(new restify.BadRequestError('There exist no user with resource id: ' + req.params.id));
                            }
                            var user = result[0];

                            if (user.username !== req.body.username) {
                                return callback(new restify.UnauthorizedError('Delivered username doesnt match with username from resource id: ' + req.params.id));
                            }

                            if (user.deleted) {
                                return callback(new restify.BadRequestError('User with id: ' + req.params.id + ' is deleted'));
                            }

                            if (user.ldapAuth) {
                                return callback(new restify.BadRequestError('LDAP is activated'));
                            }
                            return callback(null, user);

                        }, function (err) {
                            return callback(err);
                        });
            },

            function (user, callback) {
                    bcrypt.compare(req.body.currentPassword, user.pwd, function (err, succ) {
                        if (err) {
                            log.error('[/changePassword] bcrypt.compare() failed. error: ' + err);
                            return callback(new restify.InternalServerError('error at bcrypt compare function'));
                        }
                        if (!succ) {
                            log.info('[/changePassword] Client with username \'' + req.body.username + '\' tried a password change, but current password is not correct');
                            return callback(new restify.BadRequestError('Invalid current password'));
                        }
                        callback();
                    });
            },

            function (callback) {
                    bcrypt.genSalt(10, function (err, salt) {
                        if (err) {
                            log.error('[/signUp] bcrypt.genSalt() failed: ' + err);
                            return callback(new restify.InternalServerError('bcrypt pwd hashing failed'));
                        }
                        bcrypt.hash(req.body.newPassword, salt, function (err, hash) {
                            if (err) {
                                log.error('[/signUp] bcrypt.hash() failed: ' + err);
                                return callback(new restify.InternalServerError('bcrypt pwd hashing failed'));
                            }
                            return callback(null, hash);
                        });
                    });
            }

        ], function (err, hashedPassword) {
                if (err) {
                    return next(err);
                }

                queryExecutor.query({
                        sql: 'UPDATE users SET pwd=? WHERE userId=?',
                        args: [hashedPassword, req.params.id]
                    })
                    .then(function (result) {
                        var route = '[' + req.method + '=' + req.url + ']';
                        if ((req.params.id != req.user.userId) && (req.user.isAdmin)) {
                            log.info(route + ' Password updated from Admin with id ' + req.user.userId);
                        } else {
                            log.info(route + ' Password updated from User with id ' + req.user.userId);
                        }

                        res.send(200, {
                            message: 'Password successfully updated!'
                        });
                    }, function (err) {
                        return next(err);
                    })

            });
        });
    }
};
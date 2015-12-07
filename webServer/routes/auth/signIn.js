var jwt = require('jsonwebtoken'),
    jwtOptions = (require('../../config/config.json')).jwt,
    ldap = require('../../lib/ldap.js'),
    restifyJwt = require('restify-jwt'),
    restify = require('restify'),
    bcrypt = require('bcrypt'),
    log = require('../../lib/log').auth,
    constants = require('../../lib/constants'),
    async = require('async');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();
var addNewUserExecutor = new(require('../../lib/db/AddNewUserExecutor'))();

var isUsername = new RegExp(constants.USERNAME_REGEX);

module.exports = {
    apply: function (server) {

        server.get('/api/signIn', function (req, res, next) {

            if (!req.authorization.basic) {
                return next(new restify.BadRequestError('No Authorization header was found'));
            }

            var username = req.authorization.basic.username;
            var password = req.authorization.basic.password;

            if (typeof username !== 'string') {
                return next(new restify.BadRequestError('username is not from type string'));
            }

            if (!isUsername.test(username)) {
                return next(new restify.BadRequestError('username doesnt match expected pattern'));
            }

            if (typeof password !== 'string') {
                return next(new restify.BadRequestError('password is not from type string'));
            }

            if (password.length < constants.MIN_PASSWORD_LENGTH ||
                password.length > constants.MAX_PASSWORD_LENGTH) {
                return next(new restify.BadRequestError('password is either to short (min 3) or too long (max 100)'));
            }

            async.waterfall([

            function (callback) {
                    simpleQueryExecutors.query({
                            sql: 'SELECT userId, username, pwd, isAdmin, ldapAuth, deleted FROM users WHERE username=?',
                            args: [username]
                        })
                        .then(function (result) {
                            if (!result.length) {
                                return callback(null, null);
                            }
                            callback(null, result[0]);
                        }, function (err) {
                            callback(err);
                        })
            },

            function (user, callback) {
                    if (user) {
                        return callback(null, user);
                    }
                    ldap.fetchUserDetailsFromLdap(username, password, function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        log.debug("[/signInUser] ldap fetch was successfully");

                        if (!result.cn || !result.sn || !result['lfu-ums-oma']) {
                            log.error('[/signIn] can\'t read necessary object attributes from ldap fetch! Attributes: cn, sn and lfu-ums-oma are obligatory!');
                            log.error('[/signIn] LDAP-object: \n' + JSON.stringify(result));
                            return callback(new restify.InternalServerError('An error occured during the firstlogin process. Contact an admin please'));
                        }

                        var newUser = {};
                        newUser.username = result.cn;
                        newUser.email = result['lfu-ums-oma'];
                        newUser.ldapAuth = true;
                        newUser.groupId = null;
                        newUser.deleted = false;
                        newUser.isAdmin = false;

                        if (!result.givenName) {
                            var splitArr = sn.split(" ");
                            if (splitArr.length < 2) {
                                newUser.lastname = splitArr[0];
                                newUser.firstname = 'undefined';
                            } else {
                                newUser.lastname = splitArr[0];
                                newUser.firstname = splitArr[1];
                            }
                        } else {
                            newUser.firstname = result.givenName;
                            newUser.lastname = result.sn;
                        }

                        addNewUserExecutor.proceed(newUser)
                            .then(function (result) {
                                newUser.userId = result;
                                log.info('[/signIn] New user created throw ldap: ' + JSON.stringify(newUser));
                                callback(null, newUser);
                            }, function (err) {
                                callback(err);
                            });
                    });

            },
                        function (user, callback) {
                    if (user.deleted) {
                        log.info('[/signIn] Client with username \'' + username + '\' tried a login, but user is deleted!');
                        return callback(new restify.UnauthorizedError('Your account is discharged. ' +
                            'If you like to restore your account, contact an admin!'));
                    }

                    if (user.ldapAuth) {
                        ldap.authCredentialsViaLdap(username, password, function (err) {
                            if (err) {
                                return callback(err)
                            }
                            callback(null, user);
                        });
                    } else {
                        bcrypt.compare(password, user.pwd, function (err, succ) {
                            if (err) {
                                log.error('[/signIn] bcrypt.compare() failed. error: ' + err);
                                return callback(new restify.InternalServerError('error at bcrypt compare function'));
                            }
                            if (!succ) {
                                log.info('[/signIn] Client with username \'' + username + '\' tried a login, but password is not correct');
                                return callback(new restify.UnauthorizedError('invalid username or password'));
                            }
                            callback(null, user);
                        });
                    }
            }

        ], function (err, user) {
                if (err) {
                    return next(err);
                }

                var token = jwt.sign({
                        userId: user.userId,
                        isAdmin: Boolean(user.isAdmin)
                    },
                    jwtOptions.secret, {
                        expiresInMinutes: jwtOptions.exp
                    });
                res.send(200, {
                    token: token
                });
                log.info('[/signIn] ' + user.username + ' signed in');
            });
        });

    } /* end apply */
}
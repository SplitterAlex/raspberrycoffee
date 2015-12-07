var restify = require('restify'),
    bcrypt = require('bcrypt'),
    log = require('../../lib/log').auth,
    async = require('async'),
    constants = require('../../lib/constants');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();
var addNewUserExecutor = new(require('../../lib/db/AddNewUserExecutor'))();

var isUsername = new RegExp(constants.USERNAME_REGEX);

module.exports = {

    apply: function (server) {

        server.post({
            url: '/api/signUp',
            validation: {
                content: {
                    firstname: {
                        isRequired: true,
                        regex: constants.NAME_REGEX
                    },
                    lastname: {
                        isRequired: true,
                        regex: constants.NAME_REGEX
                    },
                    groupId: {
                        isRequired: true,
                        isNumeric: true
                    },
                    email: {
                        isRequired: true,
                        isEmail: true
                    }
                }
            }
        }, function (req, res, next) {

            //log.debug('[/signUp] Body: ' + JSON.stringify(req.body));

            /* validation. dont trust the client ;) */

            if (!req.authorization.basic) {
                return next(new restify.BadRequestError("No Authorization header was found"));
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

            async.parallel([

            function (callback) {
                    //check if username already exist
                    simpleQueryExecutors.query({
                            sql: 'SELECT * FROM users WHERE username=?',
                            args: [username]
                        })
                        .then(function (result) {
                            if (result.length) {
                                log.info('[/signUp] client tried to signup, but user with username: ' + username + ' already exist');
                                return callback(new restify.BadRequestError('Username already exist!'));
                            }
                            callback();
                        }, function (err) {
                            next(err);
                        });
            },

            function (callback) {
                    //calculate pwd hash and prepare user profile
                    bcrypt.genSalt(10, function (err, salt) {
                        if (err) {
                            log.error('[/signUp] bcrypt.genSalt() failed: ' + err);
                            return callback(new restify.InternalServerError('bcrypt pwd hashing failed'));
                        }
                        bcrypt.hash(password, salt, function (err, hash) {
                            if (err) {
                                log.error('[/signUp] bcrypt.hash() failed: ' + err);
                                return callback(new restify.InternalServerError('bcrypt pwd hashing failed'));
                            }
                            var newUser = {};
                            newUser.username = username;
                            newUser.firstname = req.body.firstname;
                            newUser.lastname = req.body.lastname;
                            newUser.groupId = req.body.groupId;
                            newUser.email = req.body.email;
                            newUser.ldapAuth = false;
                            newUser.pwd = hash;

                            return callback(null, hash);
                        });
                    });
            },

        ], function (err, result) {
                if (err) {
                    return next(err);
                }

                var newUser = {};
                newUser.username = username;
                newUser.firstname = req.body.firstname;
                newUser.lastname = req.body.lastname;
                newUser.groupId = req.body.groupId;
                newUser.email = req.body.email;
                newUser.ldapAuth = false;
                newUser.pwd = result[1];

                addNewUserExecutor.proceed(newUser)
                    .then(function (result) {
                        delete newUser.pwd;
                        delete newUser.ldapAuth;
                        log.info('[/signUp] New User created. ' + JSON.stringify(newUser));
                        res.send(200);
                    }, function (err) {
                        next(err);
                    });
            });
        });

        server.get({
            url: '/api/signUp/checkUsername/:name',
            validation: {
                resources: {
                    name: {
                        isRequired: true,
                        regex: constants.USERNAME_REGEX
                    }
                }
            }
        }, function (req, res, next) {
            simpleQueryExecutors.query({
                    sql: 'SELECT * FROM users WHERE username=?',
                    args: [req.params.name]
                })
                .then(function (result) {
                    if (result.length) {
                        return next(new restify.BadRequestError('Username already assigned'));
                    }
                    res.send(200);
                }, function (err) {
                    next(err);
                });
        });

    } /* end apply*/
}
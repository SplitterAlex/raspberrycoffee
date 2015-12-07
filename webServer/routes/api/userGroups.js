var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    restify = require('restify'),
    constants = require('../../lib/constants');

var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.get('/api/userGroups', function (req, res, next) {
            simpleQueryExecutors.query({
                    sql: 'Select * FROM userGroups',
                    args: []
                })
                .then(function (result) {
                    if (!result.length) {
                        return next(new restify.InternalServerError('Table userGroups is empty'));
                    }
                    res.send(result);
                }, function (err) {
                    return next(err);
                });
        });

        server.get('/api/userGroups/statistic', restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }
            simpleQueryExecutors.query({
                    sql: 'SELECT IF (t1.labels is null, "n/a", t1.labels) as labels, t1.members AS data, t2.* FROM (SELECT IF(g.shortForm is null, g.name, CONCAT(g.name, " (", g.shortForm, ")")) AS labels, COUNT(*) as members FROM userGroups g RIGHT JOIN users u ON g.id=u.groupId GROUP BY g.id UNION SELECT IF(g.shortForm is null, g.name, CONCAT(g.name, " (", g.shortForm, ")")) AS labels, COUNT(DISTINCT userId) as members FROM userGroups g LEFT JOIN users u ON g.id=u.groupId GROUP BY g.id) t1, (SELECT COUNT(*) as total FROM users) t2',
                    args: []
                })
                .then(function (result) {
                    try {
                        var data = {
                            labels: [],
                            data: [],
                            total: 0
                        }

                        for (var i = 0; i < result.length; i++) {
                            data.labels.push(result[i].labels);
                            data.data.push(result[i].data);
                        }

                        data.total = result[0].total;

                        res.send(data);
                        log.info('[' + req.method + '=' + req.url + '] accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
                    } catch (e) {
                        return next(new restify.InternalServerError(e.message));
                    }
                });
        });

        server.get({
            url: '/api/userGroups/:id',
            validation: {
                resource: {
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

            simpleQueryExecutors.query({
                    sql: 'SELECT * FROM userGroups WHERE id=?',
                    args: req.params.id
                })
                .then(function (result) {
                    if (!result.length) {
                        return next(new restify.BadRequestError('Usergroup with id: ' + req.params.id + ' doesnt exist'));
                    }
                    res.send(result[0]);
                    log.info('[' + req.method + '=' + req.url + '] accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
                }, function (err) {
                    return next(err);
                });
        });

        server.put({
                url: '/api/userGroups/:id',
                validation: {
                    resources: {
                        id: {
                            isRequired: true,
                            isNumeric: true
                        }
                    },
                    content: {
                        name: {
                            isRequired: true,
                            regex: constants.USERGROUP_NAME_REGEX
                        },
                        shortForm: {
                            isRequired: false,
                            regex: constants.USERGROUP_SHORTFORM_REGEX
                        }
                    }
                }
            },
            restifyJwt({
                secret: jwtOptions.secret
            }),
            function (req, res, next) {

                if (!req.user.isAdmin) {
                    return next(new restify.UnauthorizedError('Permission Denied'));
                }

                simpleQueryExecutors.query({
                    sql: 'UPDATE userGroups SET ? WHERE id=?',
                    args: [req.body, req.params.id]
                }).then(function (result) {
                    res.send(200, {
                        message: 'Usergroup with id: ' + req.params.id + ' successfully updated'
                    });
                    log.info('[' + req.method + '=' + req.url + '] accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
                }, function (err) {
                    return next(err);
                });
            });

        server.post({
            url: '/api/userGroups',
            validation: {
                content: {
                    name: {
                        isRequired: true,
                        regex: constants.USERGROUP_NAME_REGEX
                    },
                    shortForm: {
                        isRequired: false,
                        regex: constants.USERGROUP_SHORTFORM_REGEX
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }

            simpleQueryExecutors.query({
                sql: 'INSERT INTO userGroups SET ?',
                args: [req.body]
            })
            .then(function (result) {
                
                var usergroup = {
                    id: result.insertId,
                    name: req.body.name,
                    shortForm: (typeof req.body.shortForm === 'undefined' || req.body.shortForm == '') ? null : req.body.shortForm
                }

                res.send(200, {
                    usergroup: usergroup,
                    message: 'New usergroup successfully created'
                });
                log.info('[' + req.method + '=' + req.url + '] accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
            }, function (err) {
                return next(err);
            });
        });
    }
};
var jwt = require('jsonwebtoken'),
    jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    restify = require('restify'),
    moment = require('moment'),
    log = require('../../lib/log').user,
    constants = require('../../lib/constants'),
    authorization = require('../../lib/commonHandlers').authorization,
    logging = require('../../lib/commonHandlers').userLogging;

var queryExecutor = new (require('../../lib/db/QueryExecutor'))();

module.exports = {

    apply: function (server) {

        server.put({
            url: '/api/user/:id/key',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    key: {
                        isRequired: true,
                        regex: constants.KEY_REGEX
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            var dateAdded = moment().format('YYYY-MM-DD HH:mm:ss');
            queryExecutor.query({
                sql: 'INSERT INTO nfcKeys SET nfcKey=?, dateAdded=?, owner=?',
                args: [
                    req.body.key.toUpperCase(), 
                    dateAdded,
                    req.params.id
                ]
            })
            .then(function (result) {
                var newKeyObj = {
                    id: result.insertId,
                    nfcKey: req.body.key.toUpperCase(),
                    dateAdded: dateAdded
                }
                res.send(200, newKeyObj);
                next();
            }, function (err) {
                return next(err);
            });
            
        }, logging);


        server.del({
            url: '/api/user/:id/key/:keyId',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    },
                    keyId: {
                        isRequired: true,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), authorization, function (req, res, next) {
            
            queryExecutor.query({
                sql: 'DELETE FROM nfcKeys WHERE id=? AND owner=?',
                args: [req.params.keyId, req.params.id]
            })
            .then(function (result) {
                res.send(200);
                next();
            }, function (err) {
                return next(err);
            });

        }, logging);

        server.get({
            url: '/api/user/:id/key',
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
                sql: 'SELECT id, nfcKey, DATE_FORMAT(dateAdded, GET_FORMAT(DATETIME, "ISO")) as dateAdded FROM nfcKeys WHERE owner=?',
                args: req.params.id
            })
            .then(function (result) {
                res.send(200, result);
                next();
            }, function (err) {
                return next(err);
            });

        }, logging);

    } /* end apply */
};
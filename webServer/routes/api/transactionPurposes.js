var jwtOptions = (require('../../config/config.json')).jwt,
    restify = require('restify'),
    restifyJwt = require('restify-jwt'),
    //dbTransactionPurposes = require('../../lib/db/dbTransactionPurposes'),
    log = require('../../lib/log').default,
    utils = require('../../lib/utils');
    constants = require('../../lib/constants');

var simpleQueryExecutors = new (require('../../lib/db/SimpleQueryExecutors'));

module.exports = {

    apply: function (server) {

        server.get('/api/transactionPurposes', restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {
            
            simpleQueryExecutors.query({
                sql: 'Select * FROM transactionPurposes',
                args: []
            })
            .then(function (result) {
                if (!result) {
                    return next(new restify.InternalServerError('Table transactionPurposes is empty'));
                }
                res.send(200, result);
                log.info('[' + req.method + '=' + req.url + '] accessed from User with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
            }, function (err) {
                next(err);
            });
        });

        server.put({
            url: '/api/transactionPurposes/:id',
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
                    productNumber: {
                        isRequired: true,
                        isNumeric: true
                    },
                    name: {
                        isRequired: true,
                        regex: constants.PRODUCT_NAME_REGEX
                    },
                    price: {
                        isRequired: false,
                        isDecimal: function () {
                            this.req.body.price = utils.isDecimal(this.req.body.price);
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission denied'));
            }

            if (req.params.id != req.body.id) {
                return next(new restify.BadRequestError('id in url and id in body are not equal'));
            }

            if (req.body.productNumber < 0) {
                return next(new restify.BadRequestError('ProductNumber is negativ'));
            }

            if (req.body.price) {
                if (req.body.price < 0) {
                    return next(new restify.BadRequestError('Price should be positive'));
                }
            }


            var set = {
                    productNumber: req.body.productNumber,
                    price: (typeof req.body.price === 'number' && req.body.price >= 0) ? req.body.price : null,
                    name: req.body.name
                }
                //console.log(set);

            simpleQueryExecutors.query({
                sql: 'UPDATE transactionPurposes SET ? WHERE id=?',
                args: [set, req.params.id]
            })
            .then(function (result) {
                res.send(200, {
                    message: 'Product with id: ' + req.params.id + ' successfully updated'
                });
                log.info('[' + req.method + '=' + req.url + '] accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
            }, function (err) {
                next(err);
            });
        });

        server.post({
            url: '/api/transactionPurposes',
            validation: {
                content: {
                    productNumber: {
                        isRequired: true,
                        isNumeric: true
                    },
                    name: {
                        isRequired: true,
                        regex: constants.PRODUCT_NAME_REGEX
                    },
                    price: {
                        isRequired: false,
                        isDecimal: function () {
                            this.req.body.price = utils.isDecimal(this.req.body.price);
                        }
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {
            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission denied'));
            }

            if (req.body.productNumber < 0) {
                return next(new restify.BadRequestError('ProductNumber should be positive'));
            }

            if (req.body.price) {
                if (req.body.price < 0) {
                    return next(new restify.BadRequestError('Price should be positive'));
                }
            }

            var set = {
                    productNumber: req.body.productNumber,
                    price: (typeof req.body.price === 'number' && req.body.price >= 0) ? req.body.price : null,
                    name: req.body.name
                }
                //console.log(set);
            
            simpleQueryExecutors.query({
                sql: 'INSERT INTO transactionPurposes SET ?',
                args: [set]
            })
            .then(function (result) {
                set.id = result.insertId;
                res.send(200, {
                    transactionPurpose: set,
                    message: 'Product with id: ' + result.insertId + ' successfully updated'
                });
                log.info('[' + req.method + '=' + req.url + '] accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params))
            }, function (err) {
                next(err);
            });
        });

    }
};
var log = require('../../lib/log').pi,
    restify = require('restify'),
    jwtOptions = require('../../config/config.json').jwt,
    pMsgs = require('../../config/config.json').pMsgs,
    restifyJwt = require('restify-jwt'),
    async = require('async'),
    constants = require('../../lib/constants'),
    piAuthorization = require('../../lib/commonHandlers').piAuthorization,
    utils = require('../../lib/utils'),
    mail = require('../../lib/mail');


var simpleQueryExecutors = new(require('../../lib/db/SimpleQueryExecutors'));
var newTransactionExecutor = new(require('../../lib/db/NewTransactionExecutor'))();

module.exports = {

    apply: function (server) {

        server.post({
            url: '/api/pi/addBooking',
            validation: {
                content: {
                    authenticated: {
                        isRequired: true,
                        isBoolean: function () {
                            this.req.body.authenticated = utils.isValidBoolean(this.req.body.authenticated);
                        }
                    },
                    user_id: {
                        isRequired: function () {
                            if (this.req.body.authenticated && !this.req.body.user_id) {
                                throw 'user_id is not defined';
                            }
                        },
                        isNumeric: true,
                        min: 111111,
                    },
                    error_code: {
                        isRequired: function () {
                            if (!this.req.body.authenticated && !this.req.body.error_code) {
                                throw 'error_code is not defined';
                            }
                        },
                        isNumeric: true
                    },
                    key: {
                        isRequired: true,
                        regex: constants.KEY_REGEX
                    },
                    date: {
                        isRequired: true,
                        regex: constants.TIMESTAMP_REGEX
                    },
                    item_code: {
                        isRequired: true,
                        isNumeric: true
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.piSecret
        }), piAuthorization, function (req, res, next) {

            log.info('[addBooking] Add booking Request: ' + JSON.stringify(req.body));
            var booking = req.body;

            var fromTaker = req.user.userId;

            booking.key = booking.key.toUpperCase();

            async.waterfall([

            function (outerCallback) {

                    async.parallel([

                    function getProduct(callback) {

                            simpleQueryExecutors.query({
                                    sql: 'SELECT * FROM transactionPurposes WHERE productNumber=? && price IS NOT NULL',
                                    args: booking.item_code
                                })
                                .then(function (result) {
                                    if (!result.length) {
                                        log.error('[addBooking] Item with code: ' + booking.item_code + ' is not defined in database! Check Database: table->transactionPurposes')
                                        return callback(new restify.BadRequestError('ITEM with item_code: ' + booking.item_code + ' is not defined in database'));
                                    }
                                    callback(null, result[0]);
                                }, function (err) {
                                    callback(err, null);
                                })
                    },

                    function getUserDetails(callback) {
                            var user;

                            if (!booking.authenticated) {
                                log.info('[addBooking] New Booking arrived, but key - ' + booking.key + ' -  is not authenticated. Error: code="' + booking.error_code);
                                simpleQueryExecutors.query({
                                        sql: 'SELECT * FROM users WHERE userId=(SELECT owner FROM nfcKeys WHERE nfcKey=?)',
                                        args: booking.key
                                    })
                                    .then(function (result) {
                                        callback(null, result[0]);
                                    }, function (err) {
                                        callback(err);
                                    });
                                return;
                            }
                            simpleQueryExecutors.getUserFromUserId(booking.user_id)
                                .then(function (result) {
                                    callback(null, result[0]);
                                }, function (err) {
                                    callback(err);
                                });
                    }

                ], function prepareTransactionDetails(err, results) {
                        if (err) {
                            return outerCallback(err);
                        }

                        var selectedProduct = results[0];
                        var user = results[1];

                        var transactionDetails = {};
                        var transaction = {
                            fromTaker: fromTaker,
                            amount: Math.abs(selectedProduct.price) * -1,
                            purposeId: selectedProduct.id,
                            nfcKey: booking.key,
                            toDepositor: null,
                            note: '',
                            tDate: booking.date,
                        };

                        transactionDetails.item = selectedProduct;
                        transactionDetails.user = user;


                        /* 
                         * no user according to this key...
                         * collect this order at the depletion account,
                         * which is already the raspberryCoffee account
                         */
                        if (!user) {
                            log.info('[addBooking] No user found with key: ' + booking.key + '. Book the booking at the depletion account');
                            transaction.toDepositor = fromTaker;
                            transaction.note = 'No user found with nfcKey: "' + booking.key + '"';
                        }

                        /*
                         * user is deleted.
                         * collect this order at the depletion account
                         */
                        if (user && user.deleted) {
                            log.info('[addBooking] User with id (' + user.userId + ') is deleted. Book the booking at the depletion account');
                            transaction.toDepositor = fromTaker;
                            transaction.note = 'User "' + user.userId + '" was deleted';
                        }

                        if (transaction.toDepositor !== null) {
                            transactionDetails.groupId = null;
                            transactionDetails.transaction = transaction;
                            return outerCallback(null, transactionDetails);
                        }

                        transaction.toDepositor = user.userId;
                        transaction.note = 'coffee machine south kitchen';
                        try {
                            transaction.tDate = utils.adjustTimestampFromUserSetting(user.timeStampPrivatelySetting, booking.date);
                        } catch (e) {
                            log.err(e);
                            transaction.tDate = booking.date;
                        }
                        transactionDetails.groupId = user.groupId;
                        transactionDetails.transaction = transaction;
                        outerCallback(null, transactionDetails);
                    });

            },

            function storeNewBooking(transactionDetails, callback) {
                    newTransactionExecutor.proceed(transactionDetails.transaction, booking.date, transactionDetails.groupId)
                        .then(function (result) {
                            transactionDetails.updatedDeposit = result.updatedDeposit;
                            //add missing quantity here... The raspberry client can only book 1 transaction per once.
                            transactionDetails.transaction.quantity = 1;
                            callback(null, transactionDetails);
                        }, function (err) {
                            return callback(err, transactionDetails);
                        });
            }

        ], function (err, transactionDetails) {

                if (err) {
                    log.error('Booking cant be accomplished, cause of Database Error');
                    return next(err);
                }

                bookingResp = {};
                bookingResp.time = pMsgs[3].duration;
                bookingResp.msg1 = pMsgs[3].msg1 + transactionDetails.item.name;

                if (transactionDetails.transaction.toDepositor == fromTaker) {
                    //booking was booked on the depletion account (coffee machine account)
                    bookingResp.msg2 = ' booked. Thanks'
                } else {
                    bookingResp.msg2 = pMsgs[3].msg2 + parseFloat(Math.round(transactionDetails.updatedDeposit * 100) / 100).toFixed(2);
                }

                res.send(bookingResp);
                log.info('[addBooking] Successfully booking: ' + JSON.stringify(transactionDetails.transaction));

                if (transactionDetails.transaction.fromTaker !== transactionDetails.transaction.toDepositor) {
                    //dont send mails, when the transaction was booked on the depletion account (Raspberry PI)
                    mail.sendMailToUser(transactionDetails.user, transactionDetails.transaction, transactionDetails.updatedDeposit, transactionDetails.item);
                }
            });
        });

        server.get('/api/pi/tokenPing', restifyJwt({
            secret: jwtOptions.piSecret
        }), piAuthorization, function (req, res, next) {
            /*
             * token ping was successfully
             * JSON-web-token is valid
             */
            res.send(200);
        });
    }
};

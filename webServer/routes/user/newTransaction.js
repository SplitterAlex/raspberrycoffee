var jwtOptions = (require('../../config/config.json')).jwt,
    restify = require('restify'),
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').user,
    async = require('async'),
    mail = require('../../lib/mail'),
    logging = require('../../lib/commonHandlers').userLogging,
    authorization = require('../../lib/commonHandlers').authorization,
    utils = require('../../lib/utils'),
    constants = require('../../lib/constants');

var newTransactionExecutor = new (require('../../lib/db/NewTransactionExecutor'))();
var simpleQueryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();

module.exports = {

    apply: function (server) {

        server.post({
            url: '/api/user/:id/transaction',
            validation: {
                resources: {
                    id: {
                        isRequired: true,
                        isNumeric: true
                    }
                },
                content: {
                    tDate: {
                        isRequired: true,
                        regex: constants.TIMESTAMP_REGEX
                    },
                    fromTaker: {
                        isRequired: true,
                        isNumeric: true
                    },
                    toDepositor: {
                        isRequired: true,
                        isNumeric: true
                    },
                    amount: {
                        isRequired: true,
                        isDecimal: function () {
                            this.req.body.amount = utils.isDecimal(this.req.body.amount);
                        }
                    },
                    note: {
                        isRequired: true,
                        is: function checkLength() {
                            if (this.req.params.note.length >= constants.MAX_TRANSACTION_NOTE_LENGTH) {
                                throw 'note is too long';
                            }
                        },
                        msg: "Field is either missing or too long"
                    },
                    purposeId: {
                        isRequired: true,
                        isNumeric: true,
                        min: 1
                    },
                    quantity: {
                        isRequired: true,
                        isNumeric: true,
                        min: constants.MIN_NEW_TRANSACTION_QUANTITY,
                        max: constants.MAX_NEW_TRANSACTION_QUANTITY
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.secret
        }), function (req, res, next) {

            if (!req.user.isAdmin) {
                return next(new restify.UnauthorizedError('Permission Denied'));
            }

            var newTransaction = req.body;
            
            if (req.user.userId != newTransaction.fromTaker) {
                return next(new restify.BadRequestError('Your userId stored in your bearer token, doesnt match with the id from fromTaker'));
            }

            async.parallel([

            function (callback) {
                    simpleQueryExecutors.getUserFromUserId(newTransaction.toDepositor)
                    .then(function (result) {
                        if (!result.length) {
                            return callback(new restify.BadRequestError('toDepositor: User doesnt exist'));
                        }
                        return callback(null, result[0]);
                    }, function (err) {
                        return callback(err); 
                    });
            },

            function (callback) {
                    simpleQueryExecutors.getTransactionPurposeById(newTransaction.purposeId)
                    .then(function (result) {
                        if (!result.length) {
                            return callback(new restify.BadRequestError('purposeId: ' + newTransaction.purposeId + ' is not defined in database'));
                        }
                        var purpose = result[0];
                        if (purpose.id == constants.CREDIT) {
                            if (newTransaction.amount <= 0) {
                                return callback(new restify.BadRequestError('Credit -> Amount should be positiv'));
                            }
                            if (newTransaction.quantity != 1) {
                                return callback(new restify.BadRequestError('Credit -> Quantity should be 1'));
                            }
                        } else if (purpose.id == constants.DEBIT) {
                            if (newTransaction.amount >= 0) {
                                return callback(new restify.BadRequestError('Debit -> Amount should be negativ'));
                            }
                            if (newTransaction.quantity != 1) {
                                return callback(new restify.BadRequestError('Debit -> Quantity should be 1'));
                            }
                        } else {
                            if (newTransaction.amount !== (purpose.price * -1)) {
                                return callback(new restify.BadRequestError('Price for product ' + purpose.name + ' should be ' + purpose.price * -1 + ' Euro, but your input is ' + newTransaction.amount + ' Euro'));
                            }
                        }
                        callback(null, purpose);
                    }, function (err) {
                        return callback(err);
                    })
            }

        ], function (err, results) {
                if (err) {
                    return next(err);
                }
                var user = results[0];
                var purpose = results[1];

                var transactionDate = new Date(newTransaction.tDate);

                var fullTimeStamp = newTransaction.tDate;
                
                //dont trim the date when a credit or debit is booked
                if (newTransaction.purposeId != constants.CREDIT && newTransaction.purposeId != constants.DEBIT) {
                    try {
                        newTransaction.tDate = utils.adjustTimestampFromUserSetting(user.timeStampPrivatelySetting, newTransaction.tDate);
                    } catch (e)  {
                        return next(new restify.InternalServerError(e));
                    }
                }

                var quantity = newTransaction.quantity;
                var count = 0;
                var newDeposit;
                var storedTransactionsIds = [];
                delete newTransaction.quantity;
                //while
                async.whilst(

                    //if test is true, run addNewBooking, else finish
                    function test() {
                        return count < quantity;
                    },

                    function addNewBooking(callback) {
                        newTransactionExecutor.proceed(newTransaction, fullTimeStamp, user.groupId)
                        .then(function (result) {
                            storedTransactionsIds.push(result.transactionId);
                            newDeposit = result.updatedDeposit;
                            count++;
                            callback();
                        }, function (err) {
                            return callback(err);
                        })
                    },

                    function finish(err) {
                        if (err) {
                            return next(err);
                        }
                        var message = 'Order with ID(s):'
                        for (var j = 0; j < storedTransactionsIds.length; j++) {
                            if (j != 0) {
                                message = message + ',';
                            }
                            message = message + ' "' + storedTransactionsIds[j] + '"'
                        }
                        message = message + ' successfully completed';
                        res.send(200, {
                            message: message,
                            ids: storedTransactionsIds
                        });
                        newTransaction.quantity = quantity;
                        mail.sendMailToUser(user, newTransaction, newDeposit, purpose);
                        
                        next();
                    }
                );
            });
        }, logging);

    }
};
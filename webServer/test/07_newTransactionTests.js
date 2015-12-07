var index = require('./index');
var moment = require('moment');
var async = require('async');

var constants = require('../lib/constants');

var validNewTransactions = require('./data/newTransactions/validNewTransactionsWebPanel.json');
var validationErrNewTransactions = require('./data/newTransactions/validationErrNewTransactionWebPanel.json');
var invalidNewTransactions = require('./data/newTransactions/invalidNewTransactionsWebPanel.json');

require('it-each')();

describe('new Transaction - admin web panel ', function () {

    var purposes = [];
    var localDeposit = 0;

    before(function (done) {

        async.series([
            function (callback) {
                adminClient.get(
                    '/api/user/' + testUser.userId,
                    function (err, req, res, data) {
                        try {
                            expect(res.statusCode).to.equal(200);
                            expect(data).to.have.property('currentDeposit', 0);
                            callback();
                        } catch (e) {
                            callback(e);
                        }
                    });
            },
            function (callback) {
                myQueryExecutor
                    .setQuery('SELECT * FROM transactions')
                    .execute()
                    .then(function (result) {
                        try {
                            expect(result).to.be.instanceof(Array);
                            expect(result).to.have.length(0);
                            callback();
                        } catch(e) {
                            callback(e);
                        }
                    }, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                myQueryExecutor
                    .setQuery('SELECT * FROM transactionStatistic')
                    .execute()
                    .then(function (result) {
                        try {
                            expect(result).to.be.instanceof(Array);
                            expect(result).to.have.length(0);
                            callback();
                        } catch(e) {
                            callback(e);
                        }
                    }, function (err) {
                        callback(err);
                    });
            },
        ], function (err) {
            if (err) {
                return done(err);
            }
            done();
        });

    });

    //cleanup
    after(function (done) {
        async.series([
            function (callback) {
                myQueryExecutor
                    .setQuery('truncate transactions')
                    .execute()
                    .then(function (result) {
                        callback();
                    }, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                myQueryExecutor
                    .setQuery('truncate transactionStatistic')
                    .execute()
                    .then(function (result) {
                        callback()
                    }, function (err) {
                        callback(err);
                    });
            }
        ], function (err) {
            if (err) {
                done(err);
            }
            done();
        })

    });

    afterEach(function (done) {
        adminClient.get(
            '/api/user/' + testUser.userId,
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.property('currentDeposit', Math.round(localDeposit * 100) / 100);
                done();
            });
    });

    describe('Add bookings with validation errors from file /test/data/yourTransactions/validationErrNewTransactionWebPanel.json', function () {

        it.each(validationErrNewTransactions, "Should get validation errors", function (element, next) {
            adminClient.post(
                '/api/user/' + testUser.userId + '/transaction',
                element.transaction,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(400);
                        expect(data).to.have.property('status', 'validation failed');
                        expect(data.errors[0]).to.have.property('code', element.code);
                        expect(data.errors[0]).to.have.property('field', element.field);
                        expect(data.errors[0]).to.have.property('message', element.errMsg);
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })

    });

    describe('Add invalid bookings from file /test/data/yourTransactions/invalidNewTransactionsWebPanel.json', function () {
        it.each(invalidNewTransactions, "Should get BadRequestErrors - %s",['desc'], function (element, next) {
            adminClient.post(
                '/api/user/' + testUser.userId + '/transaction',
                element.transaction,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(400);
                        expect(data).to.have.property('code', 'BadRequestError');
                        expect(data).to.have.property('message', element.errMsg);
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })

    });


    describe('Add valid Bookings from file /test/data/yourTransactions/validNewTransactionsWebPanel.json', function () {

        it.each(validNewTransactions, "Booking...", function (element, next) {
            var i = validNewTransactions.indexOf(element);
            adminClient.post(
                '/api/user/' + testUser.userId + '/transaction',
                element.transaction,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('ids');
                        validNewTransactions[i].transaction.id = data.ids[0];
                        delete validNewTransactions[i].transaction.quantity;
                        localDeposit += element.transaction.amount;
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        });

        var transactions;
        it('get booked transactions', function (done) {
            myQueryExecutor
                .setQuery('SELECT id, DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, fromTaker, toDepositor, amount, note, purposeId FROM transactions WHERE toDepositor=?')
                .setArgs([testUser.userId])
                .execute()
                .then(function (result) {
                    try {
                        expect(result).to.be.instanceof(Array);
                        expect(result).to.have.length(validNewTransactions.length);
                        transactions = result;
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, function (err) {
                    done(err);
                });
        });

        it.each(validNewTransactions, "Compare booked transactions with file /test/data/yourTransactions/validNewTransactionsWebPanel", function (element, next) {
            transactions.should.include.something.that.deep.equals(element.transaction);
            next();
        });
    });

    describe('Add valid Booking with quantity.', function () {

        var transaction = {
            tDate: "2015-01-25 21:21:21",
            fromTaker: 111112,
            toDepositor: 111113,
            amount: -0.50,
            note: "Test booking 1 coffee (Quantity 10)",
            purposeId: 1,
            quantity: 10
        }

        var bookedIds = [];
        it('Book 10 coffees with one booking', function (done) {

            adminClient.post(
                '/api/user/' + testUser.userId + '/transaction',
                transaction,
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    expect(data).to.have.property('ids');
                    for (var i = 0; i < data.ids.length; i++) {
                        bookedIds.push(data.ids[i]);
                    }
                    expect(bookedIds).to.have.length(10);
                    localDeposit += (transaction.amount * transaction.quantity);
                    done();
                });
        });

        it('Check if 10 bookings are stored', function (done) {
            myQueryExecutor
                .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, purposeId, amount FROM transactions WHERE id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=?')
                .setArgs(bookedIds)
                .execute()
                .then(function (result) {
                    try {
                        expect(result).to.have.length(10);
                        result.should.all.have.property('purposeId', transaction.purposeId);
                        result.should.all.have.property('amount', transaction.amount);
                        result.should.all.have.property('tDate', transaction.tDate);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, function (err) {
                    done(err);
                });
        });

    });

    describe('Timestamp privately setting Tests', function () {

        var transaction = {
            tDate: "2015-01-25 22:22:22",
            fromTaker: 111112,
            toDepositor: 111113,
            amount: -0.50,
            note: "Test booking 1 coffee (Quantity 10)",
            purposeId: 1,
            quantity: 1
        }

        var bookedIds = [];
        var settings = [
            {
                setting: 'full',
                result: "2015-01-25 22:22:22"
                },
            {
                setting: 'monthly',
                result: "2015-01-01 00:00:00"
                },
            {
                setting: 'daily',
                result: "2015-01-25 00:00:00"
                },
            ];

        after(function (done) {
            adminClient.put(
                '/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                    timestampSetting: 'full'
                },
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    done();
                });
        });

        it.each(settings, "Book booking with user privately setting: %s", ['setting'], function (element, next) {
            adminClient.put(
                '/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                    timestampSetting: element.setting
                },
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);

                    adminClient.post(
                        '/api/user/' + testUser.userId + '/transaction',
                        transaction,
                        function (err, req, res, data) {
                            expect(res.statusCode).to.equal(200);
                            expect(data).to.have.property('ids');
                            bookedIds.push({
                                id: data.ids[0],
                                result: element.result
                            });
                            localDeposit += (transaction.amount * transaction.quantity);
                            next();
                        });
                });
        });

        it.each(bookedIds, "Check if timestamps are correctly stored", function (element, next) {
            myQueryExecutor
                .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, purposeId, id, amount FROM transactions WHERE id=?')
                .setArgs([element.id])
                .execute()
                .then(function (result) {
                    try {
                        expect(result).to.have.length(1);
                        //console.log(result[0].tDate + ' = ' + element.result);
                        expect(result[0].tDate).to.equal(element.result);
                        next();
                    } catch (e) {
                        next(e);
                    }
                }, function (err) {
                    next(err);
                });
        });

        it("Check if transactions are stored in statistics with fulltimeStamp", function (done) {
            myQueryExecutor
                .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, groupId, purposeId FROM transactionStatistic WHERE tDate=?')
                .setArgs([transaction.tDate])
                .execute()
                .then(function (result) {
                    try {
                        expect(result).to.have.length(3);
                        result.should.all.have.property('tDate', transaction.tDate);
                        result.should.all.have.property('groupId', testUser.groupId);
                        result.should.all.have.property('purposeId', transaction.purposeId);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, function (err) {
                    done(err);
                });
        });
    });


    describe('Credit/Debit booking', function () {

        var transaction = {
            tDate: "2015-01-25 23:23:23",
            fromTaker: 111112,
            toDepositor: 111113,
            quantity: 1
        }

        var credit = transaction;
        var debit = transaction;

        credit.amount = 4.32;
        credit.note = "Test Credit booking";
        credit.purposeId = 9;
        credit.quantity = 1;

        debit.amount = -1.89;
        debit.note = "Test debit booking";
        debit.purposeId = 10;
        debit.quantity = 1;

        //set timestamp privately setting to daily | monthly.
        //By credit/debit bookings the timestamp should not be trimed
        before(function (done) {
            adminClient.put(
                '/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                    timestampSetting: 'daily'
                },
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    done();
                });
        });

        after(function (done) {
            adminClient.put(
                '/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                    timestampSetting: 'full'
                },
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    done();
                });
        });

        it("Credit", function (done) {
            adminClient.post(
                '/api/user/' + testUser.userId + '/transaction',
                credit,
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    expect(data).to.have.property('ids');
                    localDeposit += (transaction.amount * transaction.quantity);
                    done();
                });
        });

        it("Debit", function (done) {
            adminClient.post(
                '/api/user/' + testUser.userId + '/transaction',
                debit,
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    expect(data).to.have.property('ids');
                    localDeposit += (transaction.amount * transaction.quantity);
                    done();
                });
        });

        it("Check if credit/debit are correctly stored", function (done) {
            myQueryExecutor
                .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, purposeId, amount FROM transactions where tDate=?')
                .setArgs([transaction.tDate])
                .execute()
                .then(function (result) {
                    try {
                        expect(result).to.have.length(2);
                        result.should.all.have.property('tDate', transaction.tDate);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, function (err) {
                    done(err);
                });
        });

    });

});
var cp = require('child_process');
var path = require('path');
var moment = require('moment');
var async = require('async');
var restify = require('restify');
var jwtOptions = require('../config/config.json').jwt;
var jwt = require('jsonwebtoken');


var bookingsWithoutDebtLimit = require('./data/pi/bookingsWithoutDebtLimit.json');
var bookingsWithDebtLimit = require('./data/pi/bookingsWithDebtLimit.json');
var nonValidAuthenticationRequests = require('./data/pi/nonValidAuthenticationRequests.json');
var specialBookings = require('./data/pi/specialBookings.json');
var requestsErr = require('./data/pi/requestsErr.json');

var configDb = require('./config/config').database;
var pi = require('./config/config.json').pi;

require('it-each')();

describe('PI backend.', function () {

    var piClient = null;

    before(function (done) {
        this.timeout(5000);

        var cmdLine =
            'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' < ' + path.join(__dirname, configDb.files.pi);

        async.series([
            function (callback) {
                //console.log(cmdLine);
                process.stdout.write('\tRead pi inserts ...');
                cp.exec(cmdLine, function (err, stdout, stderr) {
                    if (err) {
                        return callback(err);
                    }
                    process.stdout.write('Finish\n');
                    callback();
                });
            },
            function (callback) {
                var token = jwt.sign({ userId: pi.userId, tokenId: 0, groupId: null}, jwtOptions.piSecret)
                piClient = restify.createJsonClient({
                    version: '*',
                    url: 'http://127.0.0.1',
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                });
                callback();
            }
        ], function (err) {
            if (err) {
                done(err);
            }
            done();
        })

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
            },
            function (callback) {
                myQueryExecutor
                    .setQuery('truncate nfcKeys')
                    .execute()
                    .then(function (result) {
                        callback()
                    }, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                myQueryExecutor
                    .setQuery('DELETE FROM users WHERE NOT (userId=? or userId=?);')
                    .setArgs([adminTestUser.userId, testUser.userId])
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

    describe('Send invalid requests from file /data/pi/requestsErr.json', function () {
        it.each(requestsErr, "%s", ['desc'], function (element, next) {
            piClient.post(
                 '/api' + element.url,
                element.data,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(400);
                        if (element.errorCode === 'validation failed') {
                            expect(data).to.have.property('status', element.errorCode)
                            expect(data.errors[0]).to.have.property('code', element.code);
                            expect(data.errors[0]).to.have.property('field', element.field);
                            expect(data.errors[0]).to.have.property('message', element.errMsg);
                        } else {
                            expect(data).to.have.property('code', element.errorCode);
                            expect(data).to.have.property('message', element.errMsg);
                        }
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })
    });


    describe('Send bookings to User with no Debtlimit from file /data/pi/bookingsWithoutDebtLimit.json', function () {

        describe('Send valid bookings', function () {
            it.each(bookingsWithoutDebtLimit.bookings, "Without debtLimit", ['desc'], function (element, next) {

                var auth = element.authentication;
                var book = element.booking;
                piClient.post(
                     '/api' + auth.url,
                    auth.data,
                    function (err, req, res, data) {
                        //console.log(err);
                        try {
                            expect(res.statusCode).to.equal(200);

                            expect(data).to.have.property('authenticated', auth.result.authenticated);
                            expect(data).to.have.property('authorized', auth.result.authorized);
                            expect(data).to.have.property('user_id', auth.result.user_id);

                            expect(data.enabled_products).to.eql(auth.result.enabled_products);
                            expect(data.job_to_display).to.eql(auth.result.job_to_display);

                            piClient.post(
                                 '/api' + book.url,
                                book.data,
                                function (err, req, res, data) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    try {
                                        expect(res.statusCode).to.equal(200);
                                        expect(data).to.eql(book.result);
                                        next();
                                    } catch (e) {
                                        throw e;
                                    }
                                }
                            );
                        } catch (e) {
                            next(e);
                        }
                    }
                );
            });
        });

        describe('Check if Bookings are stored correctly in DB', function () {

            var bookingsStoredInDB = [];

            before(function (done) {
                myQueryExecutor
                    .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, fromTaker, toDepositor, amount, purposeId, nfcKey FROM transactions WHERE toDepositor=? ORDER BY id')
                    .setArgs([111141])
                    .execute()
                    .then(function (result) {
                        try {
                            expect(result).to.have.length(bookingsWithoutDebtLimit.shouldStoredInDataBase.length);
                            for (var i = 0; i < result.length; i++) {
                                bookingsStoredInDB.push(result[i]);
                            }
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }, function (err) {
                        done(err);
                    });
            })

            //var j = 0;
            it.each(bookingsWithoutDebtLimit.shouldStoredInDataBase, "Check ", ['desc'], function (element, next) {
                expect(element.entry).to.eql(bookingsStoredInDB.shift());
                next();
            });
        });

    });

    describe('Send bookings to User with Debtlimit from file /data/pi/bookingsWithDebtLimit.json', function () {

        describe('Send valid bookings', function () {
            it.each(bookingsWithDebtLimit.bookings, "With debtLimit", ['desc'], function (element, next) {

                var auth = element.authentication;
                var book = element.booking;
                piClient.post(
                     '/api' + auth.url,
                    auth.data,
                    function (err, req, res, data) {
                        //console.log(err);
                        try {
                            expect(res.statusCode).to.equal(200);

                            expect(data).to.have.property('authenticated', auth.result.authenticated);
                            expect(data).to.have.property('authorized', auth.result.authorized);
                            expect(data).to.have.property('user_id', auth.result.user_id);

                            expect(data.enabled_products).to.eql(auth.result.enabled_products);
                            expect(data.job_to_display).to.eql(auth.result.job_to_display);

                            piClient.post(
                                 '/api' + book.url,
                                book.data,
                                function (err, req, res, data) {
                                    try {
                                        expect(res.statusCode).to.equal(200);
                                        expect(data).to.eql(book.result);
                                        next();
                                    } catch (e) {
                                        throw e;
                                    }
                                }
                            );
                        } catch (e) {
                            next(e);
                        }
                    }
                );
            });
        });

        describe('Check if Bookings are stored correctly in DB', function () {

            var bookingsStoredInDB = [];

            before(function (done) {
                myQueryExecutor
                    .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, fromTaker, toDepositor, amount, purposeId, nfcKey FROM transactions WHERE toDepositor=? ORDER BY id')
                    .setArgs([111142])
                    .execute()
                    .then(function (result) {
                        try {
                            expect(result).to.have.length(bookingsWithDebtLimit.shouldStoredInDataBase.length);
                            for (var i = 0; i < result.length; i++) {
                                bookingsStoredInDB.push(result[i]);
                            }
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }, function (err) {
                        done(err);
                    });
            })

            //var j = 0;
            it.each(bookingsWithDebtLimit.shouldStoredInDataBase, "Check ", ['desc'], function (element, next) {
                expect(element.entry).to.eql(bookingsStoredInDB.shift());
                next();
            });
        });

    });

    describe('Send non valid authentication requests from file /data/pi/nonValidAuthenticationRequests.json', function () {
        it.each(nonValidAuthenticationRequests, " ", ['desc'], function (element, next) {
            piClient.post(
                 '/api' + element.url,
                element.data,
                function (err, req, res, data) {
                    //console.log(err);
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.eql(element.result);
                        next();
                    } catch (e) {
                        next(e);
                    }
                }
            );
        });
    });

    describe('Send special bookings from file /data/pi/specialBookings.json', function () {
        it.each(specialBookings, " ", ['desc'], function (element, next) {
            piClient.post(
                 '/api' + element.url,
                element.data,
                function (err, req, res, data) {
                    //console.log(err);
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.eql(element.result);
                        myQueryExecutor
                            .setQuery('SELECT DATE_FORMAT(tDate, GET_FORMAT(DATETIME, "ISO")) as tDate, fromTaker, toDepositor, amount, purposeId, nfcKey, note FROM transactions WHERE nfcKey=?')
                            .setArgs([element.data.key])
                            .execute()
                            .then(function (result) {
                                try {
                                    expect(result[0]).to.eql(element.shouldStoredInDataBase);
                                    next();
                                } catch (e) {
                                    next(e);
                                }
                            }, function (err) {
                                next(err);
                            });
                    } catch (e) {
                        next(e);
                    }
                }
            );
        });
    });


});
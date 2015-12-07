/*
var restify = require('restify');
var emailNotificationDefaultValues = require('../config/mailing.json').emailNotificationDefaultValues;
var async = require('async');
var constants = require('../lib/constants');


describe('mailing', function () {

    var client = restify.createJsonClient({
        version: '*',
        url: 'http://127.0.0.1'
    });

    var mailTestUser = {
        username: "MailTestUser",
        password: "secret!",
        token: "",
        userId: 0,
        signUpObj: {
            firstname: "Mail",
            lastname: "TestUser",
            email: "test@user.com",
            groupId: 1
        }
    }

    before(function () {
        expect(emailNotificationDefaultValues).to.be.instanceOf(Array);
    });

    //clean up
    after(function (done) {
        async.series([
            function (callback) {
                myQueryExecutor
                    .setQuery('truncate userEmailNotifications')
                    .execute()
                    .then(function (result) {
                        callback();
                    }, function (err) {
                        callback(err);
                    });
            },
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
                        callback();
                    }, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                myQueryExecutor
                    .setQuery('DELETE FROM users WHERE NOT (userId=? OR userId=?)')
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

    describe('create mailing test user', function () {

        it('signup MailTestUser', function (done) {
            var encodedCredentials = new Buffer(mailTestUser.username + ':' + mailTestUser.password).toString('base64');
            var options = {
                path: '/signUp',
                headers: {
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.post(
                options,
                mailTestUser.signUpObj,
                function (err, req, res, data) {
                    if (err) {
                        console.log(err);
                    }
                    expect(res.statusCode).to.equal(200);
                    done();
                });
        });

        it('signin MailTestUser and store token', function (done) {
            var encodedCredentials = new Buffer(mailTestUser.username + ':' + mailTestUser.password).toString('base64');
            var options = {
                path: '/signIn',
                headers: {
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.get(
                options,
                function (err, req, res, data) {
                    if (err) {
                        console.log(err);
                    }
                    expect(res.statusCode).to.equal(200);
                    expect(data).to.have.property('token');
                    var decodedData = JSON.parse(new Buffer(data.token.split('.')[1], 'base64').toString('utf8'));
                    expect(decodedData).to.have.property('isAdmin', false);
                    expect(decodedData).to.have.property('userId');
                    mailTestUser.userId = decodedData.userId;
                    mailTestUser.token = data.token;
                    done();
                });
        });

        it('check if email settings from user mailTestUser are generated and default values are correctly set', function (done) {

            var options = {
                path: '/user/' + mailTestUser.userId + '/emailSettings',
                headers: {
                    Authorization: 'Bearer ' + mailTestUser.token
                }
            }

            function findById(source, id) {
                return source.filter(function (obj) {
                    return +obj.id === +id;
                })[0];
            }

            client.get(options, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceOf(Array);
                console.log(data);
                for (var i = 0; i < emailNotificationDefaultValues.length; i++) {
                    expect(emailNotificationDefaultValues[i].isEnabled).to.equal(Boolean(findById(data, emailNotificationDefaultValues[i].id).isEnabled));
                }
                done();
            });
        });
    });

    describe('Test if attribute "send" in table "userEmailNotifications" switch to true when a new purchase is booked and currentDeposit is smaller than 0 and the threshold for an email notification is reached', function () {

        it('send new purchase to mailTestUser', function (done) {

            adminClient.post(
                '/user/' + mailTestUser.userId + '/transaction', {
                    "tDate": "2015-01-01 01:01:01",
                    "fromTaker": adminTestUser.userId,
                    "toDepositor": mailTestUser.userId,
                    "amount": -0.5,
                    "note": "Test booking 1 coffee",
                    "purposeId": 1,
                    "quantity": 1
                },
                function (err, req, res, data) {
                    console.log(err);
                    try {
                        expect(res.statusCode).to.equal(200);
                        setTimeout(done, 1000);
                    } catch (e) {
                        done(e);
                    }
                }
            )

        });

        it('check if email settings are adjusted - attribute sent should be true', function (done) {

            myQueryExecutor
                .setQuery('SELECT * FROM userEmailNotifications WHERE userId=?')
                .setArgs([mailTestUser.userId])
                .execute()
                .then(function (result) {
                    console.log(result);
                    try {
                        for (var i in result) {
                            var id = result[i].id;
                            if (id === constants.BALANCE_LOW || id === constants.OUT_OF_MONEY) {
                                expect(result[i].sent).to.equal(1);
                            }
                        }
                    } catch (e) {
                        done(e);
                    }
                }, function (err) {
                    done(err);
                });
        });

    });

});
*/
var index = require('./index');
var restify = require('restify');
var async = require('async');
var constants = require('../lib/constants');

describe('User ', function () {

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

    describe('check default settings', function () {

        var userData = null;

        before(function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                userData = data;
                done();
            });
        });

        it('debt limit', function () {
            expect(userData.debtLimit).to.be.above(0.0);
        });

        it('current deposit is 0.0', function () {
            expect(userData.currentDeposit).to.equal(0.0);
        });

        it('isActive is true', function () {
            expect(userData.isActive).to.equal(1);
        });

        it('isBlocked is false', function () {
            expect(userData.isBlocked).to.equal(0);
        });

        it('email notification are enabled', function () {
            expect(userData.enableEmailNotification).to.equal(1);
        });

        it('limit for an email notification is set', function () {
            expect(userData.enableEmailNotification).to.be.above(0.0);
        });

        it('timestamp privately setting is set to full', function () {
            expect(userData.timeStampPrivatelySetting).to.equal('full');
        });
    });


    describe('usergroups', function () {

        it(' should get an Unauthorized error', function (done) {
            userClient.put('/api/user/121212/groupId', {
                groupId: 1
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
        });

        it('set invalid user group - should get BadRequestError', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/groupId', {
                groupId: -8.9
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'Invalid number');
                done();
            });
        });

        it('set user group', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/groupId', {
                groupId: testUser.groupId
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if user group is set', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data.groupId).to.equal(testUser.groupId);
                done();
            });
        });
    });

    describe('isActive', function () {

        it(' should get an Unauthorized error', function (done) {
            userClient.put('/api/user/121212/isActive', {
                isActive: 'true'
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
        });


        it('send wrong datatype - should get a validation error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/isActive', {
                isActive: 8
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'Invalid boolean');
                done();
            });
        });

        it('set to false - should get no error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/isActive', {
                isActive: '0'
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if isActive is set to false - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(Boolean(data.isActive)).to.be.false;
                done();
            });
        });

        it('set to true - should get no error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/isActive', {
                isActive: true
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if isActive is set to true - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(Boolean(data.isActive)).to.be.true;
                done();
            });
        });
    });

    describe('isBlocked', function () {

        it(' should get an Unauthorized error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/isBlocked', {
                isBlocked: 'true'
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
        });

        it('send wrong datatype - should get a validation error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/isBlocked', {
                isBlocked: 'ttrue'
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'Invalid boolean');
                done();
            });
        });

        it('set to false - should get no error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/isBlocked', {
                isBlocked: false
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if isBlocked is set to false - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(Boolean(data.isBlocked)).to.be.false;
                done();
            });
        });

        it('set to true - should get no error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/isBlocked', {
                isBlocked: true
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if isBlocked is set to true - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(Boolean(data.isBlocked)).to.be.true;
                done();
            });
        });
    });

    describe('timeStampPrivatelySetting', function () {

        it(' should get an Unauthorized error', function (done) {
            userClient.put('/api/user/121212/timeStampPrivatelySetting', {
                timestampSetting: 'daily'
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
        });

        it('send wrong setting - should get a validation error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                timestampSetting: 'FULL'
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'Unexpected value or invalid argument');
                done();
            });
        });

        it('set to monthly - should get no error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                timestampSetting: 'monthly'
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if timeStampPrivatelySetting is set to monthly - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data.timeStampPrivatelySetting).to.equal('monthly');
                done();
            });
        });

        it('set to full - should get no error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/timeStampPrivatelySetting', {
                timestampSetting: 'full'
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if timeStampPrivatelySetting is set to full - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data.timeStampPrivatelySetting).to.equal('full');
                done();
            });
        });
    });

    describe('showNameInRanking', function () {

        it(' should get an Unauthorized error', function (done) {
            userClient.put('/api/user/121212/showNameInRanking', {
                showNameInRanking: 0
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
        });

        it('send wrong datatype - should get a validation error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/showNameInRanking', {
                showNameInRanking: ['true']
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'Invalid boolean');
                done();
            });
        });

        it('set to false - should get no error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/showNameInRanking', {
                showNameInRanking: false
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if showNameInRanking is set to false - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(Boolean(data.showNameInRanking)).to.be.false;
                done();
            });
        });

        it('set to true - should get no error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/showNameInRanking', {
                showNameInRanking: 1
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if showNameInRanking is set to full - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(Boolean(data.showNameInRanking)).to.be.true;
                done();
            });
        });
    });

    describe('debtLimit', function () {

        it(' should get an Unauthorized error', function (done) {
            userClient.put('/api/user/' + testUser.userId + '/debtLimit', {
                debtLimit: 9.45
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
        });

        it('send wrong datatype - should get a validation error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/debtLimit', {
                debtLimit: 9.989
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message');
                expect(data.errors[0].message).to.have.string('Invalid decimal');
                done();
            });
        });

        it('send negativ value - should get a BadRequestError error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/debtLimit', {
                debtLimit: '-9,98'
            }, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data.message).to.have.string('Negativ value');
                done();
            });
        });

        it('set to 5.55 - should get no error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/debtLimit', {
                debtLimit: '5,55'
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if debtLimit is set to 5.55 - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data.debtLimit).to.equal(5.55);
                done();
            });
        });

        it('set to 2.00 - should get no error', function (done) {
            adminClient.put('/api/user/' + testUser.userId + '/debtLimit', {
                debtLimit: '2'
            }, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if debtLimit is set to 2.00 - should get not error', function (done) {
            userClient.get('/api/user/' + testUser.userId, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data.debtLimit).to.equal(2.00);
                done();
            });
        });
    });

    describe('Mail settings', function () {
        var userId;

        before(function (done) {
            var options = {
                path: '/api/signIn',
                headers: {
                    Authorization: 'Basic ' + new Buffer('Test_User:secret!').toString('base64')
                }
            }
            restify.createJsonClient({
                version: '*',
                url: 'http://127.0.0.1'
            }).get(options, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.property('token');
                var decodedData = JSON.parse(new Buffer(data.token.split('.')[1], 'base64').toString('utf8'));
                expect(decodedData).to.have.property('userId');
                userId = decodedData.userId;
                done();
            });
        });

        describe('EnableEmailNotification', function () {

            it('Set enableEmailnotification to false', function (done) {
                adminClient.put(
                    '/api/user/' + userId + '/enableEmailNotification', {
                        enableEmailNotification: 'false'
                    },
                    function (err, req, res, data) {
                        if (err) {
                            console.log(err);
                        }
                        expect(res.statusCode).to.equal(200);
                        done();
                    }
                )
            });

            it('Check if enableEmailnotification is set to false', function (done) {
                adminClient.get(
                    '/api/user/' + userId,
                    function (err, req, res, data) {
                        expect(res.statusCode).to.equal(200);
                        expect(Boolean(data.enableEmailnotification)).to.be.false;
                        done();
                    }
                )
            });
        })
        
        describe('EmailSetting', function () {

            it('Set Balance_Low to false', function (done) {
                adminClient.put(
                    '/api/user/' + userId + '/emailSettings', {
                        id: constants.BALANCE_LOW,
                        value: 'false'
                    },
                    function (err, req, res, data) {
                        if (err) {
                            console.log(err);
                        }
                        expect(res.statusCode).to.equal(200);
                        done();
                    }
                )
            });

            it('Check if Balance_Low is set to false', function (done) {
                adminClient.get(
                    '/api/user/' + userId + '/emailSettings',
                    function (err, req, res, data) {
                        if (err) {
                            console.log(err);
                        }
                        expect(res.statusCode).to.equal(200);
                        
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].id === constants.BALANCE_LOW) {
                                expect(Boolean(data[i].isEnabled)).to.be.false;
                            }
                        }
                        done();
                    }
                )
            });
        })

        describe('EmailCreditLimitForNotification', function () {

            it('send wrong datatype - should get a validation error', function (done) {
                adminClient.put('/api/user/' + userId + '/emailCreditLimitForNotification', {
                    emailCreditLimitForNotification: 9.989
                }, function (err, req, res, data) {
                    expect(res.statusCode).to.equal(400);
                    expect(data).to.have.property('status', 'validation failed');
                    expect(data).to.have.deep.property('errors[0].message');
                    expect(data.errors[0].message).to.have.string('Invalid decimal');
                    done();
                });
            });

            it('send negativ value - should get a BadRequestError error', function (done) {
                adminClient.put('/api/user/' + userId + '/emailCreditLimitForNotification', {
                    emailCreditLimitForNotification: '-9,98'
                }, function (err, req, res, data) {
                    expect(res.statusCode).to.equal(400);
                    expect(data.message).to.have.string('positiv');
                    done();
                });
            });

            it('set to 5.55 - should get no error', function (done) {
                adminClient.put('/api/user/' + userId + '/emailCreditLimitForNotification', {
                    emailCreditLimitForNotification: '5,55'
                }, function (err, req, res, data) {
                    if (err) {
                        console.log(err);
                    }
                    expect(res.statusCode).to.equal(200);
                    done();
                });
            });

            it('check if emailCreditLimitForNotification is set to 5.55 - should get not error', function (done) {
                adminClient.get('/api/user/' + userId, function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    expect(data.emailCreditLimitForNotification).to.equal(5.55);
                    done();
                });
            });

            it('set to 2.00 - should get no error', function (done) {
                adminClient.put('/api/user/' + userId + '/emailCreditLimitForNotification', {
                    emailCreditLimitForNotification: '2'
                }, function (err, req, res, data) {
                    if (err) {
                        console.log(err);
                    }
                    expect(res.statusCode).to.equal(200);
                    done();
                });
            });

            it('check if emailCreditLimitForNotification is set to 2.00 - should get not error', function (done) {
                adminClient.get('/api/user/' + userId, function (err, req, res, data) {
                    expect(res.statusCode).to.equal(200);
                    expect(data.emailCreditLimitForNotification).to.equal(2.00);
                    done();
                });
            });

        })

    });

});
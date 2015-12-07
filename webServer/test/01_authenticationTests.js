var restify = require('restify');
var emailNotificationDefaultValues = require('../config/mailing.json').emailNotificationDefaultValues;


describe('authentication', function () {

    var client = restify.createJsonClient({
        version: '*',
        url: 'http://127.0.0.1'
    });

    before(function () {
        expect(emailNotificationDefaultValues).to.be.instanceOf(Array);
    });

    describe('call tokenPing with no token', function () {
        it('should get a InvalidCredentials response', function (done) {
            client.get('/api/tokenPing', function (err, req, res, data) {
                expect(data).to.have.property('code', 'InvalidCredentials');
                done();
            });
        });
    });

    describe('signup/signIn checks', function () {

        var newUser = {
            username: "Test_User",
            password: "secret!",
            signUpObj: {
                firstname: "Firstname",
                lastname: "Lastname",
                email: "test@user.com",
                groupId: 1
            }

        }

        // no body is defined
        it('should get a BadRequestError response - signUp', function (done) {
            var options = {
                path: '/api/signUp',
                headers: {}
            }
            client.post(options, function (err, req, res, data) {
                expect(data).to.have.property('status', 'validation failed');
                done();
            });
        });

        // no authorization header is defined
        it('should get a BadRequestError response - signIn', function (done) {
            var options = {
                path: '/api/signIn',
                headers: {}
            }
            client.get(options, function (err, req, res, data) {
                //console.log(err);
                expect(data).to.have.property('code', 'BadRequestError');
                expect(data).to.have.property('message', 'No Authorization header was found');
                done();
            });
        });

        // ?????? is not a valid username!
        it('send invalid username, should get BadRequestError', function (done) {
            var encodedCredentials = new Buffer('?????:veryWrongPassword').toString('base64');
            var options = {
                path: '/api/signIn',
                headers: {
                    //?????:veryWrongPassword
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.get(options, function (err, req, res, data) {
                //console.log(err);
                expect(data).to.have.property('code', 'BadRequestError');
                expect(data.message).to.have.string('pattern');
                done();
            });
        });

        it('should get a UnauthorizedError response', function (done) {
            var options = {
                path: '/api/signIn',
                headers: {
                    //anything:veryWrongPassword
                    Authorization: 'Basic YW55dGhpbmc6dmVyeVdyb25nUGFzc3dvcmQ='
                }
            }
            client.get(options, function (err, req, res, data) {
                expect(data).to.have.property('code', 'UnauthorizedError');
                done();
            });
        });

        // username Test_User is not assigned
        it('check if Username Test_User is not assigned', function (done) {
            var options = {
                path: '/api/signUp/checkUsername/' + newUser.username,
                headers: {}
            }
            client.get(options, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('signup test_user with invalid email', function (done) {
            var encodedCredentials = new Buffer(newUser.username + ':' + newUser.password).toString('base64');
            var options = {
                path: '/api/signUp',
                headers: {
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.post(options, {
                    firstname: "Firstname",
                    lastname: "Lastname",
                    email: "test@@user.com",
                    groupId: 1
                },
                function (err, req, res, data) {
                    //console.log(err);
                    expect(res.statusCode).to.equal(400);
                    expect(data).to.have.property('status', 'validation failed');
                    expect(data).to.have.deep.property('errors[0].message', 'Invalid email');
                    done();
                });
        });

        it('signup test_user with invalid groupId', function (done) {
            var encodedCredentials = new Buffer(newUser.username + ':' + newUser.password).toString('base64');
            var options = {
                path: '/api/signUp',
                headers: {
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.post(options, {
                    firstname: "Firstname",
                    lastname: "Lastname",
                    email: "test@user.com",
                    groupId: 9999
                },
                function (err, req, res, data) {
                    expect(res.statusCode).to.equal(422);
                    done();
                });
        });


        it('signup test_user', function (done) {
            var encodedCredentials = new Buffer(newUser.username + ':' + newUser.password).toString('base64');
            var options = {
                path: '/api/signUp',
                headers: {
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.post(options, newUser.signUpObj, function (err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        // username Test_User is not assigned
        it('check if Username Test_User is assigned', function (done) {
            var options = {
                path: '/api/signUp/checkUsername/' + newUser.username,
                headers: {}
            }
            client.get(options, function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                done();
            });
        });

        var token = null;
        var userId = null;

        // check if Test_User can signin
        it('check if Test_User can successfully signIn', function (done) {
            var encodedCredentials = new Buffer(newUser.username + ':' + newUser.password).toString('base64');
            var options = {
                path: '/api/signIn',
                headers: {
                    Authorization: 'Basic ' + encodedCredentials
                }
            }
            client.get(options, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.property('token');
                var decodedData = JSON.parse(new Buffer(data.token.split('.')[1], 'base64').toString('utf8'));
                expect(decodedData).to.have.property('isAdmin', false);
                expect(decodedData).to.have.property('userId');

                userId = decodedData.userId;
                token = data.token;
                done();
            });
        });

        it('check token from Test_User', function (done) {
            expect(token).to.be.not.a('null');

            var options = {
                path: '/api/tokenPing',
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }
            client.get(options, function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

        it('check if email settings from Test_User are generated and default values are correctly set', function (done) {
            expect(token).to.be.not.a('null');
            expect(userId).to.be.not.a('null');

            var options = {
                path: '/api/user/' + userId + '/emailSettings',
                headers: {
                    Authorization: 'Bearer ' + token
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
                for (var i = 0; i < emailNotificationDefaultValues.length; i++) {
                    expect(emailNotificationDefaultValues[i].isEnabled).to.equal(Boolean(findById(data, emailNotificationDefaultValues[i].id).isEnabled));
                }
                done();
            });
        });

    });
});
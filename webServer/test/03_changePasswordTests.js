var index = require('./index');
var async = require('async');

//var myAsyncFn = require('./database/executor').myAsyncFn;

describe('change password test', function () {

    it('should get an unauthorized error', function (done) {
        userClient.put(
            '/api/user/121212/changePassword', {
                currentPassword: 'foobar',
                newPassword: 'newFoobar',
                username: 'Mr_Unknown'
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
    });

    it(' new password is too short', function (done) {
        userClient.put(
            '/api/user/' + testUser.userId + '/changePassword', {
                currentPassword: 'foobar',
                newPassword: '11',
                username: 'Mr_Unknown'
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'New password is either too short or too long');
                done();
            });
    });

    it(' current password is missing', function (done) {
        userClient.put(
            '/api/user/' + testUser.userId + '/changePassword', {
                currentPassword: '',
                newPassword: '11',
                username: 'Mr_Unknown'
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'Field is required');
                done();
            });
    });

    it(' new password is too long', function (done) {
        userClient.put(
            '/api/user/' + testUser.userId + '/changePassword', {
                currentPassword: 'foobar',
                newPassword: '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901',
                username: 'Mr_Unknown'
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('status', 'validation failed');
                expect(data).to.have.deep.property('errors[0].message', 'New password is either too short or too long');
                done();
            });
    });

    it(' username doesnt exist - should get an unauthorized error', function (done) {
        userClient.put(
            '/api/user/' + testUser.userId + '/changePassword', {
                currentPassword: 'foobar',
                newPassword: 'newFoobar',
                username: 'Mr_Unknown'
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(401);
                done();
            });
    });

    it(' ldapAuth is set - should get a BadRequestError', function (done) {

        async.series([

        function setLDAPToTrue(callback) {
                myQueryExecutor
                    .setQuery('UPDATE users SET ldapAuth=? WHERE userId=?')
                    .setArgs([true, testUser.userId])
                    .execute()
                    .should.be.fulfilled.notify(callback);
            },

            function (callback) {
                userClient.put(
                    '/api/user/' + testUser.userId + '/changePassword', {
                        currentPassword: 'foobar',
                        newPassword: 'newFoobar',
                        username: testUser.username
                    },
                    function (err, req, res, data) {
                        expect(res.statusCode).to.equal(400);
                        expect(data).to.have.property('message', 'LDAP is activated');
                        callback();
                    });
            },

            function setLDAPToFalse(callback) {
                myQueryExecutor
                    .setQuery('UPDATE users SET ldapAuth=? WHERE userId=?')
                    .setArgs([false, testUser.userId])
                    .execute()
                    .should.be.fulfilled.notify(callback);
            }

        ], function (err) {
            expect(err).to.be.a('undefined');
            done();
        });
    });

    it(' current password is not correct - should get a BadRequestError', function (done) {
        userClient.put(
            '/api/user/' + testUser.userId + '/changePassword', {
                currentPassword: 'wrong_password',
                newPassword: 'foobar',
                username: testUser.username
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('message', 'Invalid current password');
                done();
            });
    });


    var newPwd = 'newSecret!';
    it(' set new password', function (done) {
        userClient.put(
            '/api/user/' + testUser.userId + '/changePassword', {
                currentPassword: testUser.password,
                newPassword: newPwd,
                username: testUser.username
            },
            function (err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
            });
    });

    it('login with new password', function (done) {
        var options = {
            path: '/api/signIn',
            headers: {
                Authorization: 'Basic ' + new Buffer(testUser.username + ':' + newPwd).toString('base64')
            }
        }
        userClient.get(options, function (err, req, res, data) {
            expect(res.statusCode).to.equal(200);
            done();
        });
    });

    it('set password back to old one', function (done) {
        myQueryExecutor
            .setQuery('UPDATE users SET pwd=? WHERE userId=?')
            .setArgs([testUser.hashedPassword, testUser.userId])
            .execute()
            .should.be.fulfilled.notify(done);
    });

});
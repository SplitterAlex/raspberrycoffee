
var cp = require('child_process');
var path = require('path');
var configDb = require('./config/config').database;
var qs = require('querystring');
var async = require('async');


var requestsErr = require('./data/users/requestsErr.json');
var requests = require('./data/users/requests.json');

require('it-each')();

describe('Users', function () {
    
    before(function (done) {
        this.timeout(5000);
        
        var cmdLine =
            'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' < ' + path.join(__dirname, configDb.files.users);
        
        //console.log(cmdLine);
        console.log('\tRead transactions ...');
        cp.exec(cmdLine, function (err, stdout, stderr) {
            if (err) {
                done(err);
            }
            done();
        });
    });
    
    //cleanup
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
        });

    });
    
    it('should get Unauthorized error', function (done) {
        userClient.get(
            '/api/user',
            function (err, req, res, data) {
                try {
                    expect(res.statusCode).to.equal(401);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        );
    });
    
    
    describe('send requests with errors from file /test/data/users/requestsErr.json', function () {

        it.each(requestsErr, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(400);
                        if (element.errorCode === 'validation failed') {
                            expect(data).to.have.property('status', 'validation failed');
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
                }
            );
        });
    });
    
    describe('Send valid requests from file /data/users/requests.json', function () {

        it.each(requests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.be.instanceof(Array);
                        expect(data).to.have.length(element.result.length);
                        next();
                    } catch (e) {
                        throw e;
                    }
                }
            );
        });
    });
});
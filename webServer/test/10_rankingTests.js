
var cp = require('child_process');
var path = require('path');
var configDb = require('./config/config').database;
var qs = require('querystring');
var async = require('async');

var rankingRequests = require('./data/statistics/rankingRequests.json');
var rankingRequestsErr = require('./data/statistics/rankingRequestsErr.json');

require('it-each')();

describe('Ranking.', function () {
    
    before(function (done) {
        this.timeout(5000);
        
        var cmdLine =
            'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' < ' + path.join(__dirname, configDb.files.statistics);
        
        //console.log(cmdLine);
        console.log('\tRead transactions ...');
        cp.exec(cmdLine, function (err, stdout, stderr) {
            if (err) {
                done(err);
            }
            done();
        });
    });
    
    describe('Send invalid requests from file /data/statistics/rankingRequestsErr.json', function () {
        it.each(rankingRequestsErr, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            userClient.get(
                url,
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
   
    describe('Send valid requests from file /data/statistics/rankingRequests.json', function () {
        it.each(rankingRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            userClient.get(
                url,
                function (err, req, res, data) {
                    if (err) {
                        console.log(err);
                    }
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.be.instanceof(Array);
                        expect(data).to.have.length(element.length);
                        for (var i = 0; i < element.result.length; i++) {
                            var r = element.result[i];
                            expect(data[r.rank -1]).to.have.property('id', r.id);
                            expect(data[r.rank -1]).to.have.property('total', r.total);
                        }
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })
    });
    
});
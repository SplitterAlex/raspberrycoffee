
var qs = require('querystring');
var async = require('async');

var dashboardRequests = require('./data/statistics/dashboardRequests.json');
var dashboardRequestsErr = require('./data/statistics/dashboardRequestsErr.json');

require('it-each')();

describe('Dashboard.', function () {
    
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
    
    describe('Send invalid requests from file /data/statistics/dashboardRequestsErr.json', function () {
        it.each(dashboardRequestsErr, "%s", ['desc'], function (element, next) {
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

    describe('Send valid requests from file /data/statistics/dashboardRequests.json', function () {
        it.each(dashboardRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    var result = element.result;
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('globalRankingPlace', result.globalRankingPlace);
                        expect(data).to.have.property('groupRankingPlace', result.groupRankingPlace);
                        expect(data).to.have.property('investedMoney', result.investedMoney);
                        expect(data).to.have.property('count');
                        expect(data.count).to.eql(result.count);
                        expect(data.mcc).to.eql(result.mcc);
                        
                        
                        expect(data).to.have.property('ccc');
                        expect(data.ccc).to.have.property('user');
                        expect(data.ccc).to.have.property('global');
                        expect(data.ccc).to.have.property('group');
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })
    });
    
});
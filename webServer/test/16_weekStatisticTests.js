var cp = require('child_process');
var path = require('path');
var configDb = require('./config/config').database;
var qs = require('querystring');
var moment = require('moment');
var async = require('async');

var weekStatisticRequests = require('./data/statistics/weekStatisticRequests.json');
var weekStatisticRequestsErr = require('./data/statistics/weekStatisticRequestsErr.json');

require('it-each')();

describe('Week statistic.', function () {
    
    var labels = [];
    
    before(function (done) {
        this.timeout(5000);
        
        var cmdLine =
            'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' < ' + path.join(__dirname, configDb.files.weekStatistic);
        
        //console.log(cmdLine);
        console.log('\tRead week statistic sql file ...');
        cp.exec(cmdLine, function (err, stdout, stderr) {
            if (err) {
                done(err);
            }
            console.log('\tReading week statistic sql file finish');
            var momentObj = moment();
            for (var i = 0; i < 7; i++) {
                if (i == 0) {
                    labels.unshift('Today');
                    continue;
                }
                momentObj.subtract(1, 'days');
                if (i == 1) {
                    labels.unshift('Yesterday');
                    continue;
                }
                labels.unshift(momentObj.format('dddd'));
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
    

    describe('Send invalid requests from file /data/statistics/weekStatisticRequestsErr.json', function () {
        it.each(weekStatisticRequestsErr, "%s", ['desc'], function (element, next) {
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

    describe('Send valid requests from file /data/statistics/weekStatisticRequests.json', function () {
        it.each(weekStatisticRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('labels');
                        expect(data.labels).to.eql(labels);

                        expect(data).to.have.property('data');
                        expect(data.data).to.have.property('Total');
                        expect(data.data).to.have.property('Coffee');
                        expect(data.data).to.have.property('Espresso');
                        expect(data.data).to.have.property('Latte');
                        expect(data.data).to.have.property('Cappuccino');
                        
                        expect(data.data.Total).to.eql(element.result.data.Total);
                        expect(data.data.Coffee).to.eql(element.result.data.Coffee);
                        expect(data.data.Espresso).to.eql(element.result.data.Espresso);
                        expect(data.data.Latte).to.eql(element.result.data.Latte);
                        expect(data.data.Cappuccino).to.eql(element.result.data.Cappuccino);
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })
    });
    
});
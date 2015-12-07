
var cp = require('child_process');
var path = require('path');
var configDb = require('./config/config').database;
var qs = require('querystring');
var async = require('async');

var validationErrYourTransactions = require('./data/yourTransactionsAndAdminTransactions/validationErrYourTransactions.json');
var validYourTransactionRequests = require('./data/yourTransactionsAndAdminTransactions/validYourTransactionRequests.json');

var validationErrTransactions = require('./data/yourTransactionsAndAdminTransactions/validationErrTransactions.json');
var validTransactionRequests = require('./data/yourTransactionsAndAdminTransactions/validTransactionRequests.json');

require('it-each')();

describe('Your transaction and admin transaction tests', function () {
    
    before(function (done) {
        this.timeout(5000);
        
        var cmdLine =
            'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' < ' + path.join(__dirname, configDb.files.transactions);
        
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
    
    
    describe('send user requests with errors from file /test/data/yourTransactions/validationErrYourTransactions.json', function () {

        it.each(validationErrYourTransactions, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            userClient.get(
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
                });
        })

    });
    
    describe('Send user valid requests from file /data/yourTransactions/validYourTransactionRequests.json', function () {

        it.each(validYourTransactionRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            userClient.get(
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
                });
        })

    });
    
    describe('Send admin requests with errors from file /test/data/yourTransactions/validationErrTransactions.json', function () {

        it.each(validationErrTransactions, "%s", ['desc'], function (element, next) {
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
                });
        })

    });
    
    describe('Send valid admin requests from file /data/yourTransactions/validTransactionRequests.json', function () {

        it.each(validTransactionRequests, "%s", ['desc'], function (element, next) {
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
                });
        })

    });
    
    
    
});
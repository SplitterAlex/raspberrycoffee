var qs = require('querystring');

var dayStatisticRequests = require('./data/statistics/dayStatisticRequests.json');
var dayStatisticRequestsErr = require('./data/statistics/dayStatisticRequestsErr.json');

require('it-each')();

describe('Day statistic.', function () {
    

    describe('Send invalid requests from file /data/statistics/dayStatisticRequestsErr.json', function () {
        it.each(dayStatisticRequestsErr, "%s", ['desc'], function (element, next) {
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

    describe('Send valid requests from file /data/statistics/dayStatisticRequests.json', function () {
        it.each(dayStatisticRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    if (err) {
                        console.log(err);
                    }
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('series');
                        expect(data.series).to.eql(element.result.series);
                        expect(data.data[0]).to.eql(element.result.data[0]);
                        expect(data.data[1]).to.eql(element.result.data[1]);
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })
    });
    
});
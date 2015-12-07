var qs = require('querystring');

var monthStatisticRequests = require('./data/statistics/monthStatisticRequests.json');
var monthStatisticRequestsErr = require('./data/statistics/monthStatisticRequestsErr.json');

require('it-each')();

describe('Month statistic.', function () {
    

    describe('Send invalid requests from file /data/statistics/monthStatisticRequestsErr.json', function () {
        it.each(monthStatisticRequestsErr, "%s", ['desc'], function (element, next) {
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
   
    describe('Send valid requests from file /data/statistics/monthStatisticRequests.json', function () {
        it.each(monthStatisticRequests, "%s", ['desc'], function (element, next) {
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
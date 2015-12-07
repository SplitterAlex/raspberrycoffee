var qs = require('querystring');
var moment = require('moment');

var coffeeConsumptionRequests = require('./data/statistics/coffeeConsumptionRequests.json');
var coffeeConsumptionRequestsErr = require('./data/statistics/coffeeConsumptionRequestsErr.json');

require('it-each')();

describe('Coffee Consumption.', function () {
    
    describe('Send invalid requests from file /data/statistics/coffeeConsumptionRequestsErr.json', function () {
        it.each(coffeeConsumptionRequestsErr, "%s", ['desc'], function (element, next) {
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
   
    describe('Send valid requests from file /data/statistics/coffeeConsumptionRequests.json', function () {
        it.each(coffeeConsumptionRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('total', element.result.total);
                        expect(data).to.have.property('dateRange');
                        expect(data.dateRange).to.have.property('startDate', element.result.startDate);
                        if (element.result.endDate === '') {
                            expect(data.dateRange).to.have.property('endDate', moment().endOf('month').format('YYYY-MM-DD'));
                        } else {
                            expect(data.dateRange).to.have.property('endDate', element.result.endDate);
                        }
                        
                        
                        
                        expect(data).to.have.property('data');
                        expect(data.data).to.be.instanceof(Array);
                        for (var i = 0; i < element.result.data.length; i++) {
                            var e = element.result.data[i];
                            data.labels.should.contain(e.label);
                            expect(data.data[data.labels.indexOf(e.label)]).to.equal(e.count);
                        }
                        next();
                    } catch (e) {
                        throw e;
                    }
                });
        })
    });
    
});
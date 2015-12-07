var qs = require('querystring');

var customRangeStatisticRequests = require('./data/statistics/customRangeStatisticRequests.json');
var customRangeStatisticRequestsErr = require('./data/statistics/customRangeStatisticRequestsErr.json');

require('it-each')();

describe('Custom range statistic.', function () {
    

    describe('Send invalid requests from file /data/statistics/customRangeStatisticRequestsErr.json', function () {
        it.each(customRangeStatisticRequestsErr, "%s", ['desc'], function (element, next) {
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

    describe('Send valid requests from file /data/statistics/customRangeStatisticRequests.json', function () {
        it.each(customRangeStatisticRequests, "%s", ['desc'], function (element, next) {
            var url = '/api' + element.url + '?' + qs.stringify(element.queries);
            //console.log(url);
            adminClient.get(
                url,
                function (err, req, res, data) {
                    try {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('labels');
                        expect(data.labels).to.eql(element.result.labels);
                        
                        expect(data).to.have.property('dataIndexMap');
                        expect(data.dataIndexMap).to.eql(element.result.dataIndexMap);
                        
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
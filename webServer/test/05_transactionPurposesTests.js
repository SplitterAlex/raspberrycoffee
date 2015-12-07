
var index = require('./index');
var async = require('async');

describe('Transaction purposes', function() {
    
    //clean up
    after(function (done) {
        async.series([
            
            function (callback) {
                myQueryExecutor
                    .setQuery('DELETE FROM transactionPurposes WHERE id=?')
                    .setArgs([newPurposeWithPrice.id])
                    .execute()
                    .then(function (result) {
                        try {
                            expect(result).to.have.property('affectedRows', 1);
                            callback();
                        } catch (e) {
                            callback(e);
                        }
                    });
            },
            
            function (callback) {
                myQueryExecutor
                    .setQuery('DELETE FROM transactionPurposes WHERE id=?')
                    .setArgs([newPurposeWithoutPrice.id])
                    .execute()
                    .then(function (result) {
                        try {
                            expect(result).to.have.property('affectedRows', 1);
                            callback();
                        } catch (e) {
                            callback(e);
                        }
                    });
            }
            
        ], function (err) {
            if (err) {
                done(err);
            }
            done();
        });
    });

    
    it('get transaction purposes - should get an array', function(done) {
        adminClient.get('/api/transactionPurposes', function(err, req, res, data) {
            expect(res.statusCode).to.equal(200);
            expect(data).to.be.instanceof(Array);
            done();
        });
    });
    
    var newPurposeWithPrice;
    it('add new purpose with price', function(done) {
        adminClient.post(
            '/api/transactionPurposes', 
            {
                productNumber: 998,
                name: 'withPrice',
                price: '5,5'
            },
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.deep.property('transactionPurpose.id');
                expect(data).to.have.deep.property('transactionPurpose.productNumber', 998);
                expect(data).to.have.deep.property('transactionPurpose.price', 5.5);
                newPurposeWithPrice = data.transactionPurpose;
                done();
        });
    });
    
    var newPurposeWithoutPrice;
    it('add new purpose without price', function(done) {
        adminClient.post(
            '/api/transactionPurposes', 
            {
                productNumber: 999,
                name: 'withoutPrice',
                price: null
            },
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.deep.property('transactionPurpose.id');
                expect(data).to.have.deep.property('transactionPurpose.productNumber', 999);
                expect(data).to.have.deep.property('transactionPurpose.price', null);
                newPurposeWithoutPrice = data.transactionPurpose;
                done();
        });
    });
    
    it('add new purpose with identical productnumber', function(done) {
        adminClient.post(
            '/api/transactionPurposes', 
            {
                productNumber: 999,
                name: 'foo',
                price: 0.00
            },
            function(err, req, res, data) {
                console.log(data);
                expect(res.statusCode).to.equal(400);
                expect(data).to.have.property('message', 'Request can not accomplished, cause of duplicate entrys in the database');
                done();
        });
    });
    
    it('check if new purposes are correctly stored', function(done) {
        adminClient.get(
            '/api/transactionPurposes',
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceof(Array);

                data.should.include.something.that.deep.equals(newPurposeWithPrice);
                data.should.include.something.that.deep.equals(newPurposeWithoutPrice);
                done();
        });
    });
    
    it('edit new purpose - set Price to 2.33', function(done) {
        newPurposeWithPrice.price = '2,33';
        adminClient.put(
            '/api/transactionPurposes/' + newPurposeWithPrice.id, 
            newPurposeWithPrice,
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                newPurposeWithPrice.price = 2.33;
                done();
        });
    });
    
    it('edit new purpose - set Price to 0.33', function(done) {
        newPurposeWithoutPrice.price = 0.33;
        adminClient.put(
            '/api/transactionPurposes/' + newPurposeWithoutPrice.id, 
            newPurposeWithoutPrice,
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
        });
    });
    
    it('check if the price have changed', function(done) {
        adminClient.get(
            '/api/transactionPurposes',
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceof(Array);
                data.should.include.something.that.deep.equals(newPurposeWithPrice);
                data.should.include.something.that.deep.equals(newPurposeWithoutPrice);
                done();
        });
    });
    
});

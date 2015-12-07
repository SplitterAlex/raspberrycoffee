
var index = require('./index');

describe('User keys (NFC) test', function() {
    
    it('should get an array', function(done) {
        userClient.get('/api/user/' + testUser.userId + '/key', function(err, req, res, data) {
            expect(res.statusCode).to.equal(200);
            expect(data).to.be.instanceof(Array);
            done();
        });
    });
    
    it('should get InvalidCredentials response', function(done) {
        userClient.get('/api/user/999999/key', function(err, req, res, data) {
            expect(res.statusCode).to.equal(401);
            done();
        });
    });
    
    it('test wrong key pattern - should get validation error', function(done) {
        userClient.put('/api/user/' + testUser.userId + '/key', {key: '\'ZUIKL23"$§$%'}, function(err, req, res, data) {
            expect(res.statusCode).to.equal(400);
            expect(data).to.have.property('status', 'validation failed');
            expect(data).to.have.deep.property('errors[0].message', 'Invalid characters');
            done();
        });
    });
    
    describe('PUT DEL Tests', function () {
        
        var key1 = 'ABCDEF1234567890'
        var keyObj1;
        
        var key2 = 'BCDEF123456789'
        var keyObj2;
        
        it('add new key - should get 200 OK response', function(done) {
            userClient.put('/api/user/' + testUser.userId + '/key', {key: key1}, function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.property('id');
                expect(data).to.have.property('nfcKey', key1);
                expect(data).to.have.property('dateAdded');
                keyObj1 = data;
                done();
            });
        });
    
        it('add new key - should get 200 OK response', function(done) {
            userClient.put('/api/user/' + testUser.userId + '/key', {key: key2}, function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.property('id');
                expect(data).to.have.property('nfcKey', key2);
                expect(data).to.have.property('dateAdded');
                keyObj2 = data;
                done();
            });
        });
        
        it('add same key again - should get BadRequestError response', function(done) {
            userClient.put('/api/user/' + testUser.userId + '/key', {key: key1}, function(err, req, res, data) {
                expect(res.statusCode).to.equal(400);
                expect(data.message).to.equal('Request can not accomplished, cause of duplicate entrys in the database');
                done();
            });
        });
        
        it('should get an array with stored key', function(done) {
            userClient.get('/api/user/' + testUser.userId + '/key', function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceof(Array);
                data.should.include.something.that.deep.equals(keyObj1);
                data.should.include.something.that.deep.equals(keyObj2);
                done();
            });
        });
        
        it('delete key - should get 200 OK response', function(done) {
            userClient.del('/api/user/' + testUser.userId + '/key/' + keyObj1.id, function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
        
        it('delete key - should get 200 OK response', function(done) {
            userClient.del('/api/user/' + testUser.userId + '/key/' + keyObj2.id, function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
        
        it('delete same key again - should get BadRequestError response', function(done) {
            userClient.del('/api/user/' + testUser.userId + '/key/' + keyObj1.id, function(err, req, res, data) {
                //console.log(err);
                expect(res.statusCode).to.equal(400);
                done();
            });
        });
        
        it('check if keys are deleted', function(done) {
            userClient.get('/api/user/' + testUser.userId + '/key', function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceof(Array);
                data.should.not.include.something.that.deep.equals(keyObj1);
                data.should.not.include.something.that.deep.equals(keyObj2);
                done();
            });
        });
        
    });
});

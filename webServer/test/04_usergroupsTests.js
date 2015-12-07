
var index = require('./index');
var async = require('async');

describe('Usergroups', function() {
    
    //clean up
    after(function (done) {
        async.series([
            
            function (callback) {
                myQueryExecutor
                    .setQuery('DELETE FROM userGroups WHERE id=?')
                    .setArgs([newUsergroup1.id])
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
                    .setQuery('DELETE FROM userGroups WHERE id=?')
                    .setArgs([newUsergroup2.id])
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

    
    it('get usergroups - should get an array', function(done) {
        adminClient.get('/api/userGroups', function(err, req, res, data) {
            if (err) {
                console.log(err);
            }
            expect(res.statusCode).to.equal(200);
            expect(data).to.be.instanceof(Array);
            done();
        });
    });
    
    var newUsergroup1;
    it('add new usergroup', function(done) {
        adminClient.post(
            '/api/userGroups', 
            {
                name: 'NewUserGroup1',
                shortForm: 'NWG1'
            },
            function(err, req, res, data) {
                if (err) {
                    console.log(err);
                }   
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.deep.property('usergroup.id');
                expect(data).to.have.deep.property('usergroup.name', 'NewUserGroup1');
                expect(data).to.have.deep.property('usergroup.shortForm', 'NWG1');
                newUsergroup1 = data.usergroup;
                done();
        });
    });
    
    var newUsergroup2;
    it('add new usergroup without short form', function(done) {
        adminClient.post(
            '/api/userGroups', 
            {
                name: 'newUserGroup2',
            },
            function(err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                expect(data).to.have.deep.property('usergroup.id');
                expect(data).to.have.deep.property('usergroup.name', 'newUserGroup2');
                expect(data).to.have.deep.property('usergroup.shortForm', null);
                newUsergroup2 = data.usergroup;
                done();
        });
    });
    
    it('check if new usergroups are correctly stored', function(done) {
        adminClient.get(
            '/api/userGroups',
            function(err, req, res, data) {
                if (err) {
                    console.log(err);
                }
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceof(Array);

                data.should.include.something.that.deep.equals(newUsergroup1);
                data.should.include.something.that.deep.equals(newUsergroup2);
                done();
        });
    });
    
    it('edit user group 1 - set name to newNewUserGroup1', function(done) {
        newUsergroup1.name = 'newNewUserGroup1';
        adminClient.put(
            '/api/userGroups/' + newUsergroup1.id, 
            newUsergroup1,
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
        });
    });
    
    it('edit user group 2 - set shortForm to NWG2', function(done) {
        newUsergroup2.shortForm = 'NWG2';
        adminClient.put(
            '/api/userGroups/' + newUsergroup2.id, 
            newUsergroup2,
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                done();
        });
    });
    
    it('check if usergroups have changed', function(done) {
        adminClient.get(
            '/api/userGroups',
            function(err, req, res, data) {
                expect(res.statusCode).to.equal(200);
                expect(data).to.be.instanceof(Array);
                data.should.include.something.that.deep.equals(newUsergroup1);
                data.should.include.something.that.deep.equals(newUsergroup2);
                done();
        });
    });
    
});

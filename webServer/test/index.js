var restify = require('restify');

var server = require('../lib/server').create();

var async = require('async');
var path = require('path');
var cp = require('child_process');

testUser = require('./config/config.json').testUser;
adminTestUser = require('./config/config.json').adminTestUser;
myQueryExecutor = new (require('./database/executor'))();

chai = require('chai');
assert = require('assert');
chaiAsPromised = require("chai-as-promised");
chaiThings = require('chai-things');
should = chai.should();
expect = chai.expect;
chai.use(chaiThings);
chai.use(chaiAsPromised);

var configDb = require('./config/config').database;
var serverDefinitions = require('../config/config.json');


adminClient = null;
userClient = null;


// prepare database, perpare test users, create server
before(function (done) {
    this.timeout(5000);

    if (!process.env.TEST_RUN) {
        throw new Error('RUN TESTS WITH: $ [sudo] TEST_RUN=active npm test');
    }

    async.series([
        
        function createTestDatabase(callback) {

            var cmdLine =
                'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' -e "DROP DATABASE IF EXISTS ' + configDb.databaseName + ';CREATE DATABASE ' + configDb.databaseName + '"';

            process.stdout.write('Create test database and create tables ...');
            cp.exec(cmdLine, function (err, stdout, stderr) {
                if (err) {
                    callback(err);
                }
                
                callback();
            });
        },

        function fillTestDatabase(callback) {

            var cmdLine =
                'mysql -u ' + configDb.user + ' --password=' + configDb.pwd + ' ' + configDb.databaseName + ' < ' + path.join(__dirname, configDb.files.schema);

            cp.exec(cmdLine, function (err, stdout, stderr) {
                if (err) {
                    callback(err);
                }
                process.stdout.write(' Finish\n');
                callback();
            });
        },

        function insertTestUsers(callback) {

            async.series([

                function insertTestUser(innerCallback) {
                    myQueryExecutor
                        .setQuery('INSERT INTO users (userId, username, firstname, lastname, email, ldapAuth, pwd) VALUES (?,?,?,?,?,?,?)')
                        .setArgs(
                        [
                            testUser.userId,
                            testUser.username,
                            testUser.firstname,
                            testUser.lastname,
                            testUser.email,
                            testUser.ldapAuth,
                            testUser.hashedPassword
                        ])
                        .execute()
                        .then(function (result) {
                            return innerCallback(null, result);
                        }, function (err) {
                            return innerCallback(err);
                        });
                },

                function insertAdminTestUser(innerCallback) {
                    myQueryExecutor
                        .setQuery('INSERT INTO users (userId, username, firstname, lastname, email, ldapAuth, pwd, isAdmin) VALUES (?,?,?,?,?,?,?,?)')
                        .setArgs(
                        [
                            adminTestUser.userId,
                            adminTestUser.username,
                            adminTestUser.firstname,
                            adminTestUser.lastname,
                            adminTestUser.email,
                            adminTestUser.ldapAuth,
                            adminTestUser.hashedPassword,
                            true
                        ])
                        .execute()
                        .then(function (result) {
                            return innerCallback(null, result);
                        }, function (err) {
                            return innerCallback(err);
                        });
                },

            ], function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback();
            });

        },

        function startServer(callback) {
            process.stdout.write('Starting server: ' + serverDefinitions.host + ':' + serverDefinitions.port);
            server.listen(serverDefinitions.port, serverDefinitions.host, function (err) {
                if (err) {
                    return callback(err);
                }
                process.stdout.write(' STARTED\n');
                callback();
            });
        },

        function getApiTokensForAdminAndUser(callback) {
            var client = restify.createJsonClient({
                version: '*',
                url: 'http://127.0.0.1',
            });
            process.stdout.write('Preparing an admin and an user restify JSON client for requests ...');

            async.parallel([

                function (callback) {
                    var options = {
                        path: '/api/signIn',
                        headers: {
                            Authorization: 'Basic ' + new Buffer(testUser.username + ':' + testUser.password).toString('base64')
                        }
                    }
                    client.get(options, function (err, req, res, data) {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('token');
                        userClient = restify.createJsonClient({
                            version: '*',
                            url: 'http://127.0.0.1',
                            headers: {
                                Authorization: 'Bearer ' + data.token
                            }
                        });
                        //userToken = data.token;
                        callback();
                    });
            },

            function (callback) {
                    var options = {
                        path: '/api/signIn',
                        headers: {
                            Authorization: 'Basic ' + new Buffer(adminTestUser.username + ':' + adminTestUser.password).toString('base64')
                        }
                    }
                    client.get(options, function (err, req, res, data) {
                        expect(res.statusCode).to.equal(200);
                        expect(data).to.have.property('token');
                        adminClient = restify.createJsonClient({
                            version: '*',
                            url: 'http://127.0.0.1',
                            headers: {
                                Authorization: 'Bearer ' + data.token
                            }
                        });
                        //adminToken = data.token;
                        callback();
                    });
            }

        ], function (err, results) {
                process.stdout.write(' Finish\n');
                callback();
            });

        }

    ], function (err, results) {
        if (err) {
            console.log(err);
        }
        console.log('Preparing test environment finisch\n');
        done();
    });
});

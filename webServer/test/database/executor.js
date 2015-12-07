var Q = require('q');
var dbTest = (require('../../test/config/config.json')).database;

var mysql = require('mysql');

var QueryExecutor = function () {
    this._query;
    this._args;
}

QueryExecutor.prototype.setQuery = function (query) {
    if (typeof query !== 'string') {
        throw new Error('query is not a string.');
    }
    this._query = query;
    return this;
}

QueryExecutor.prototype.getQuery = function () {
    return this._query;
}

QueryExecutor.prototype.setArgs = function (args) {
    if( Object.prototype.toString.call(args) !== '[object Array]' ) {
        throw new Error('vars is not a array.');
    }
    this._args = args;
    return this;
}

QueryExecutor.prototype.clean = function () {
    this._query = null;
    this._args = null;
    return this;
}

QueryExecutor.prototype.execute = function() {
    
    if (typeof this._query !== 'string') {
        throw new Error('query is not set.');
    }
    
    if( Object.prototype.toString.call(this._args) !== '[object Array]' ) {
        this._args = [];
    }
    
    //var _this = this;
    
    //open new single connection. DONT USE a pool for tests, or mocha
    //get some weird trouble ...
    var connection = mysql.createConnection({
        host: dbTest.host,
        user: dbTest.user,
        password: dbTest.pwd,
        database: dbTest.databaseName
    });
    
    var deferred = Q.defer();
    
    connection.connect();
    
    connection.query(this._query, this._args, function(err, rows, fields) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(rows);
        }
    });
    
    connection.end();
    this.clean();
    return deferred.promise;
}

module.exports = QueryExecutor;

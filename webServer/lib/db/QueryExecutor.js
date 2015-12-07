var Q = require('q');
var log = require('../log').database;
var restify = require('restify');
var mysql = require('mysql');

var pool;

if (process.env.TEST_RUN) {
    var dbTest = (require('../../test/config/config.json')).database;
    pool = mysql.createPool({
        host: dbTest.host,
        user: dbTest.user,
        password: dbTest.pwd,
        database: dbTest.databaseName,
        connectionLimit: dbTest.connectionLimit
    });
} else {
    var db = (require('../../config/config.json')).database;
    pool = mysql.createPool({
        host: db.host,
        user: db.user,
        password: db.pwd,
        database: db.databaseName,
        connectionLimit: db.connectionLimit,
        timezone: db.timezone
    });
}


var QueryExecutor = function () {
    this.pool = pool;
};

QueryExecutor.prototype = (function () {

    var errorHandling = function (err) {
        log.error(err);
        if (err.fatal) {
            return new restify.ServiceUnavailableError('Database Fatal Error: ' + err.code);
        } else if (err.code === 'ER_DUP_ENTRY') {
            return new restify.BadRequestError('Request can not accomplished, cause of duplicate entrys in the database');
        }
        return new restify.UnprocessableEntityError('Database query failed: ' + err.code);
    };

    function getPool() {
        return this.pool;
    }

    function executor (toExecute) {
        if (typeof toExecute !== 'object') {
            throw new Error('toExecute is not from type object');
        }

        if (typeof toExecute.sql !== 'string') {
            throw new Error('sql is not from type string');
        }

        var deferred = Q.defer();

        this.pool.getConnection(function (err, connection) {
            if (err) {
                return deferred.reject(errorHandling(err));
            }
            var query = connection.query(toExecute.sql, toExecute.args, function (err, result) {
                connection.release();
                if (err) {
                    return deferred.reject(errorHandling(err));
                }
                if (toExecute.sql.toLowerCase().indexOf('select') < 0) {
                    if (result.affectedRows < 1) {
                        log.error('Executed sql query doesnt take any affect.\n\tSQL: "' + query.sql + '"');
                        return deferred.reject(new restify.BadRequestError('Executed sql query doesnt take any affect. Take a look in the database.log file for more details'));
                    }
                }
                deferred.notify();
                return deferred.resolve(result);
            });
        });
        return deferred.promise;
    }

    return {

        constructor: QueryExecutor,
        
        errorHandling: function (err) {
            return this._(errorHandling)(err);
        },

        getPool: function () {
            return this._(getPool)();
        },

        query: function (toExecute) {
            return this._(executor)(toExecute);
        },
        
        _:function (callback) {
            var self = this;
            return function () {
                return callback.apply(self, arguments);
            }
        }
    }
})();


module.exports = QueryExecutor;
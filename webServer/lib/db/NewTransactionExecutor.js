var QueryExecutor = require('./QueryExecutor');
var async = require('async');
var log = require('../log').database;
var Q = require('q');

function extend(B, A) {
    function I() {};
    I.prototype = A.prototype;
    B.prototype = new I;
    B.prototype.constructor = B;
    B.prototype.parent = A;
};

var NewTransactionExecutor = function () {
    this.parent.call(this);
    this.pool = this.getPool();
};

extend(NewTransactionExecutor, QueryExecutor);

NewTransactionExecutor.prototype.proceed = function (transaction, fullTimeStamp, groupId) {

    var conn = {connection: null};
    
    var transactionId;
    var updatedDeposit;
    var oldDeposit;
    
    var deferred = Q.defer();
    
    var _this = this;
    
    async.series([
        
        function (callback) {
            //log.debug('getConnection');
            (_this.pool).getConnection (function (err, connection) {
                if (err) { return callback(err);   }
                conn.connection = connection;
                return callback();
            });
        },
        
        function (callback) {
            //log.debug('beginTransaction');
            conn.connection.beginTransaction(function (err) {
                if (err) { return callback(err);   }
                return callback();
            });
        },
        
        function (outerCallback) {
            
            async.parallel([
                
                function (callback) {
                    conn.connection.query('SELECT currentDeposit, deleted FROM users WHERE userId=? FOR UPDATE', transaction.toDepositor, function (err, result) {
                        //log.debug(transaction);
                        if (err) {
                            return callback(err);
                        }
                        oldDeposit = result[0].currentDeposit;
                        updatedDeposit = result[0].currentDeposit + transaction.amount;
                        //console.log('Old:' + result[0].currentDeposit);
                        //console.log('New:' + updatedDeposit);
                        conn.connection.query('UPDATE users SET ? WHERE userId=?', [{ currentDeposit: updatedDeposit}, transaction.toDepositor], function (err, result) {
                            if (err) {
                                return callback(err);
                            }
                            return callback();
                        });
                    });
                },
                
                function (callback) {
                    //log.debug('sqlInsertNewBooking');
                    conn.connection.query('INSERT INTO transactions SET ?', transaction, function (err, result) {
                        if (err) { return callback(err); }
                        transactionId = result.insertId;
                        return callback();
                    });
                },
                                                
            ], function (err) {
                if (err) {
                    //log.debug(err);
                    return conn.connection.rollback(function () {
                        return outerCallback(err);
                    });
                }
                return outerCallback();
            });
        },
            
        function (callback) {
            //log.debug('commit');
            conn.connection.commit(function (err) {
                if (err) {
                    return conn.connection.rollback(function () {
                        return callback(err);
                    })
                }
                return callback();
            });
            
        }
        
    ], function (err) {
        
        if (conn.connection !== null) {
                conn.connection.release();
        }
        if (err) {
            return deferred.reject(_this.errorHandling(err));
        }
        
        _this.query({
            sql: 'INSERT INTO transactionStatistic SET ?',
            args: {
                tDate: fullTimeStamp,
                purposeId: transaction.purposeId,
                groupId: groupId
            }
        })
        .then(function (result) {
            deferred.resolve({transactionId: transactionId, updatedDeposit: updatedDeposit, oldDeposit: oldDeposit});
        }, function (err) {
            log.error('Cant add booking to statistic, cause of Database Error: ' + err.message);
        }, function () {
            
        });
    });
    
    return deferred.promise;
}

module.exports = NewTransactionExecutor;
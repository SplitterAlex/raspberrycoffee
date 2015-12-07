var QueryExecutor = require('./QueryExecutor');
var Q = require('q');

var log = require('../log').database,
    restify = require('restify'),
    async = require('async'),
    mailDefaultValues = (require('../../config/mailing.json')).emailNotificationDefaultValues;

function extend(B, A) {
    function I() {};
    I.prototype = A.prototype;
    B.prototype = new I;
    B.prototype.constructor = B;
    B.prototype.parent = A;
};

var AddNewUserExecutor = function () {
    this.parent.call(this);
    this.pool = this.getPool();
};

extend(AddNewUserExecutor, QueryExecutor);

AddNewUserExecutor.prototype.proceed = function (user) {

    var conn = {connection: null};

    var deferred = Q.defer();
    
    var _this = this;
    
    async.waterfall([
        
        function (callback) {
            //log.debug('getConnection');
            (_this.pool).getConnection (function (err, connection) {
                if (err) { 
                    return callback(err);
                }
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
        
        function (callback) {
            conn.connection.query('INSERT INTO users SET ?', user, function(err, result) {
                if (err) {
                    return callback(err);   
                }
                callback(null, result.insertId);
            });
        },
        
        function (userId, callback) {
            conn.connection.query('SELECT id FROM emailNotificationTypes', function (err, ids) {
                if (err) {
                    return callback(err);   
                }
                
                if (!ids.length) {
                    return callback(new restify.InternalServerError('Table emailNotificationTypes is empty'));   
                }
                callback(null, userId, ids);
            });
        },
        
        function (userId, ids, callback) {
            async.eachSeries(ids, function (id, callback) {
                var isEnabled = null;
                for (var i in mailDefaultValues) {
                    if (mailDefaultValues[i].id === id.id) {
                        isEnabled = mailDefaultValues[i].isEnabled;
                    }
                };
                
                if (isEnabled === null) {
                    return callback(new restify.InternalServerError('Default Value in /webServer/config/mail.json from mail with id ' + id.id + ' is not defined in config/mailing.json.'));
                }
                conn.connection.query('INSERT INTO userEmailNotifications (userId, notificationTypeId, isEnabled) VALUES (?,?,?)', [userId, id.id, isEnabled], function (err) {
                    if (err) {
                        return callback(err);   
                    }
                    callback();
                }); 
            }, function (err) {
                if (err) {
                    return callback(err)   
                }
                callback(null, userId);
            });
        }
        
    ], function (err, userId) {
        if (err) {
            if (conn.connection !== null) {
                return conn.connection.rollback(function () {
                    conn.connection.release();
                    return deferred.reject(_this.errorHandling(err));
                });
            }
            return deferred.reject(_this.errorHandling(err));
        }
        conn.connection.commit(function (err) {
            if (err) {
                return conn.connection.rollback(function () {
                    conn.connection.release();
                    return deferred.reject(_this.errorHandling(err));
                }); 
            }
            conn.connection.release();
            return deferred.resolve(userId);
        });
    });
    return deferred.promise;
}

module.exports = AddNewUserExecutor;
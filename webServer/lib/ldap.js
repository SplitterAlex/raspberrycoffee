process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var ldap = require('ldapjs'),
    ldapConfig = (require('../config/config')).ldap,
    log = require('./log').auth,
    restify = require('restify'),
    constants = require('./constants');

var isStudent = new RegExp(constants.LDAP_STUDENT_REGEX);
var isInstitute = new RegExp(constants.LDAP_INSTITUTE_REGEX);

function errorHandling(err, callback) {
    log.error('[LDAP] ' + err);
    if (err.code == 49 ) {
        /*
         * LDAP_INVALID_CREDENTIALS (49)
         */
        return callback(new restify.UnauthorizedError('Invalid username or password'));
    } else {
        /* LDAP server error or connection error happend.
         *
         * TODO: NOTIFY ADMIN
         *
         * Error could be:
         * 
         * LDAP_AUTH_METHOD_NOT_SUPPORTED (7)
         * Indicates that during a bind operation the client
         * requested an authentication method not supported
         * by the LDAP server.
         *
         * LDAP_UNAVAILABLE (52)
         * Indicates that the LDAP server cannot process the
         * client's bind request, usually because it is shutting down.
         *
         * LDAP_UNWILLING_TO_PERFORM (53)
         * Indicates that the LDAP server cannot process
         * the request because of server-defined restrictions.*/
        if (err.code == 80) {
            log.error('[LDAP] LDAP error 80: Code: ' + err.code + ' Message: ' + err.message);
            if ((err.message).search('timeout') !== -1) {
                return callback(new restify.ServiceUnavailableError('Can\'t connect to LDAP-Server for authentication. Request timeout. Pls try again. If this error still occurs, contact an admin.'));
            }
        }
        return callback(new restify.InternalServerError('LDAP Error - code: "' + err.code + '", msg: "' + err.message + '"'));
    }
}
    
    

function fetchEntry(dn, cn, password, client, callback) {

    var f = '(cn=' + cn + ')';
  
    var opts = {
    //filter: '(cn=csap3468)',
        filter: f,
        scope: 'sub'
    };
  
    client.bind(dn, password, function (err) {
    
        if (err) {
            log.error('[LDAP] LDAP bind error in function "fetchEntry". Code: ' + err.code + ' Message: ' + err.message);
            return callback(err);
        }
        client.search('dc=uibk,dc=ac,dc=at', opts, function (err, res) {
            if (err) {
                log.error('[LDAP] LDAP search error in function "fetchEntry". Code: ' + err.code + ' Message: ' + err.message);
                return callback(err);
            }
      
            var entrys = [];
            
            res.on('searchEntry', function(entry) {
                entrys.push(entry.object);
            });
      
            res.on('error', function (err) {
                log.error('[LDAP] LDAP error in function "fetchEntry" at "error". Code: ' + err.code + ' Message: ' + err.message);
                return callback(err);
            });
      
            res.on('end', function (result) {
                if (result.status !== 0) {
                    log.error('[LDAP] LDAP search error in function "fetchEntry" at "end". ldap status code is not 0. Statuscode: ' + result.status);
                    return callback(new ldap.OtherError('non-zero status from LDAP search - end: ' + result.status));
                }
                return callback(null, entrys);
            });
        });
    });
}


function fetchUserDetailsFromLdap(username, password, callback) {
    
    var ou;
    if (isInstitute.test(username)) {
        ou = 'iuser';
    } else if (isStudent.test(username)) {
        ou = 'suser';
    } else {
        log.info('[LDAP] Username: ' + username + ' doesnt match expected pattern for Student users or Institute users');
        return callback(new restify.UnauthorizedError('Invalid username or password'));  
    }
    
    var dn = 'cn=' + username + ',ou=' + ou + ',ou=user,ou=uibk,dc=uibk,dc=ac,dc=at';

    var client = ldap.createClient({url: ldapConfig.host + ':' + ldapConfig.port,
                                        timeout: ldapConfig.timeout, connectTimeout: ldapConfig.connectionTimeout });
  
    fetchEntry(dn, username, password, client, function (err, res) {
        client.unbind(function (err) {
            if (err) {
                log.error('[LDAP] LDAP unbind error in function "fetchUserDetailsFromLdap". Code: ' + err.code + ' Message: ' + err.message);
            }
        });
        if (err) {
            return errorHandling(err, callback);
        }

        switch (res.length) {
            case 0:
                return callback();
            case 1:
                return callback(null, res[0]);
            default:
                log.error('[LDAP] LDAP error: unexpected number of matches. There should only one!' + res[0] + '-' + res[1]);
                return callback(new restify.BadRequestError('Unexpected amount of matches with your ZID credentials'));
        }
    });
}

function authCredentialsViaLdap(username, password, callback) {
    
    var ou;
    if (isInstitute.test(username)) {
        ou = 'iuser';
    } else if (isStudent.test(username)) {
        ou = 'suser';
    } else {
        log.info('[LDAP] Username: ' + username + ' doesnt match expected pattern for Student users or Institute users');
        return callback(new restify.UnauthorizedError('Invalid username or password'));  
    }
    
    var dn = 'cn=' + username + ',ou=' + ou + ',ou=user,ou=uibk,dc=uibk,dc=ac,dc=at';
        
    var client = ldap.createClient({url: ldapConfig.host + ':' + ldapConfig.port,
                        timeout: ldapConfig.timeout, connectTimeout: ldapConfig.connectionTimeout });
        
    client.bind(dn, password, function (err) {
        if (err) {
            return errorHandling(err, callback);
        }
        log.debug('[LDAP] bind was successfully');
        client.unbind(function (unbindErr) {
            if (unbindErr) {
                log.error('[LDAP] LDAP unbind error in function "authCredentialsViaLdap". Code: ' + unbindErr.code + ' Message: ' + unbindErr.message);
            }
        });
        return callback();
    });
}



exports.fetchUserDetailsFromLdap = fetchUserDetailsFromLdap;
exports.authCredentialsViaLdap = authCredentialsViaLdap;


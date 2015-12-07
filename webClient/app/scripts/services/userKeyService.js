'use strict';


angular.module('clientApp').factory('UserKeyResource', ['$resource', function ($resource) {

    return $resource('/api/user/:id/key/:keyId', 
        {},
        {
        get: {method: 'GET', isArray:true},
        delete: {method: 'DELETE'},
        put: {method: 'PUT'}
        }
    );
}]);



angular.module('clientApp').service('UserKeyService', ['UserKeyResource', 'UserService', function(UserKeyResource, UserService) {

    var nfcKeys = [];
    
    this.list = function () {
        return nfcKeys;   
    };
    
    this.getKeys = function (callback) {
        UserKeyResource.get({id: UserService.getLoggedUser().userId},
            function (keys) {
                for (var i = 0; i < keys.length; i++) {
                    nfcKeys.push(keys[i]);   
                }
                callback(null);
            }, function (err) {
                callback(err);
            }
        );     
    };
    
    this.deleteKey = function (keyId, callback) {
        UserKeyResource.delete({id: UserService.getLoggedUser().userId, keyId: keyId},
            function () {
                for (var i in nfcKeys) {
                    if (nfcKeys[i].id === keyId) {
                        nfcKeys.splice(i, 1);
                        break;
                    }
                }
                callback();
            }, function (err) {
                callback(err);
            });   
    };
    
    this.saveKey = function (key, callback) {
        UserKeyResource.put({id: UserService.getLoggedUser().userId}, {key: key},
            function (key) {
                nfcKeys.push(key);
                callback(null, key);
            }, function (err) {
                callback(err);
            }
        );  
    };
    
    this.clear = function () {
        nfcKeys.splice(0, nfcKeys.length);
    };
    
    

}]);

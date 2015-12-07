'use strict';

angular.module('clientApp').factory('AuthFactory', ['$http', '$window', '$location', '$rootScope', function ($http, $window, $location, $rootScope) {
    
    
    var authFactory = {};
    
    authFactory.signIn = function (username, pwd) {

        var encodedData = window.btoa(username + ':' + pwd);
        
        return $http.get('/api/signIn',
                  { headers: {'Authorization': 'Basic ' + encodedData }})
        .success(function (data) {
            $window.localStorage.token = data.token;
            if ($rootScope.pathToForward) {
                $location.path($rootScope.pathToForward);
            } else {
                $location.path('/controlPanel/dashboard');
            }
        });
        
        //return authResponse;
    };
    
    authFactory.signUp = function (newUser, groupId) {
        
        var encodedData = window.btoa(newUser.username + ':' + newUser.password);
        
        //cant get groups - server error
        if (groupId === 999) {
            groupId = null;
        }
        
        var postData = {
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            groupId: groupId
        };
        
        return $http({
            url: '/api/signUp',
            method: 'POST',
            data: JSON.stringify(postData),
            headers: {'Authorization': 'Basic ' + encodedData,
                      'Content-Type': 'application/json'
            }
        });
    };
    
    return authFactory;
    
    
}]);


angular.module('clientApp').service('CheckToken', ['$http', '$window', '$location', '$q', 'UserService', 'ClearService', function($http, $window, $location, $q, UserService, ClearService) {
    
    function urlBase64Decode(str) {
        var output = str.replace('-', '+').replace('_', '/');
        switch (output.length % 4) {
            case 0:
                    break;
            case 2:
                output += '==';
                break;
            case 3:
                output += '=';
                break;
            default:
                throw 'Illegal base64url string!';
        }
        return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
    }
    
    this.checkTokenAndInitUserService = function () {
        var deferred = $q.defer();
        //console.log('checkToken');
        $http.get('/api/tokenPing')
            .success(function () {
                var profile = JSON.parse(urlBase64Decode($window.localStorage.token.split('.')[1]));
                UserService.getUser(profile.userId, function (err) {
                    if (err) {
                        console.log('At token pink: user init error');
                        delete $window.localStorage.token;
                        $location.path('/');
                        deferred.reject();
                    }
                    deferred.resolve();
                });
            })
            .error(function () {
                ClearService.clear();
                deferred.reject();
                $location.path('/'); 
            });
        return deferred.promise;
    };
    
}]);

angular.module('clientApp').factory('tokenInterceptor', ['$rootScope', '$q', '$window', '$location', '$timeout', function ($rootScope, $q, $window, $location, $timeout) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($window.localStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
            }
            return config;
        },
        responseError: function (rejection) {
            if (rejection.status === 401) {
                if ($window.localStorage.token) {
                    $rootScope.tokenExpired = true;
                    $timeout(function () {
                        $rootScope.tokenExpired = false;
                    }, 10000);
                }
                delete $window.localStorage.token;
                $location.path('/');
            }
            return $q.reject(rejection);
        }
    };
}]);

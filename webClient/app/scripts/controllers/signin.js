'use strict';


/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('SigninCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', '$route', 'AuthFactory', function ($scope, $http, $window, $location, $rootScope, $timeout, $route, AuthFactory) {
        
        function init() {
            
            $scope.clearForm = 0;
            $scope.signupSuccess = false;
            
            $scope.newUser = {};
            $scope.newUser.username = '';
            $scope.newUser.firstname = '';
            $scope.newUser.lastname = '';
            $scope.newUser.password = '';
            $scope.newUser.passwordConfirm = '';
            $scope.newUser.email = '';
            
            $scope.signinButtonValue = 'Sign In';
            $scope.signupButtonValue = 'Sign Up';
            $scope.authenticated = 'false';
            
            $scope.options = [ {label: 'loading groups. . .', value: 0}];
            $scope.selectedGroup = $scope.options[0];
        }
                
        init();
        
        $scope.signin = function () {
            
            $scope.signinButtonValue = 'login... pls wait';
            
            $scope.signinError = false;
            
            var signinButton = $('#signinButton');
            signinButton.prop('disabled', true);
            
            AuthFactory.signIn($scope.user.username, $scope.user.password)
                .error(function (data, status) {
                    if (status === 0 || status === 503) {
                        $scope.errMessage = 'Server is offline/not responding';
                    } else if (status === 404)  {
                        $scope.errMessage = '404 (Not Found)';
                    } else {
                        $scope.errMessage = data.message;
                    }
                    $scope.signinError = true;
                })
                .finally(function () {
                    $scope.signinButtonValue = 'Sign In';
                    signinButton.prop('disabled', false);
                });
        };
        
        $scope.signup = function () {
            
            var signupButton = $('#signupButton');
            signupButton.prop('disabled', true);
            
            $scope.signupButtonValue = 'pls wait ...';
            $scope.signupError = false;
            
            AuthFactory.signUp($scope.newUser, ($scope.selectedGroup).value)
                .success(function () {
                    $scope.signupSuccess = true;
                    $scope.clearSignupForm();
                
                })
                .error(function (data, status) {
                    if (status === 0 || status === 503) {
                        $scope.errMessage = 'Server is offline/not responding';
                    } else {
                        $scope.errMessage = data.message;
                    }
                    $scope.signupError = true;
                })
                .finally(function () {
                    signupButton.prop('disabled', false);
                    $scope.signupButtonValue = 'Sign Up';
                });
        };
    
        $scope.clearSignupForm = function () {
            // clear signup Form . . .
            $scope.newUser.username = '';
            $scope.newUser.firstname = '';
            $scope.newUser.lastname = '';
            $scope.signupError = false;
            $scope.selectedGroup = $scope.options[0];
            $scope.newUser.email = '';
            $scope.newUser.password = '';
            $scope.newUser.passwordConfirm = '';
            $scope.clearForm += 1;
            $scope.signupForm.$setPristine();
            $scope.signupForm.$setUntouched();
            $('#signupModal').modal('hide');
        };
    }]);
    
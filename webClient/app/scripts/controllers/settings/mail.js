'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('MailCtrl', ['$scope', '$timeout', 'UserService', function ($scope, $timeout, UserService) {
        
        function init() {
            
            $scope.toggle = {};
            
            $scope.emailSettings = [];
            
            $scope.user.emailCreditLimitForNotification = parseFloat($scope.user.emailCreditLimitForNotification * 100 / 100).toFixed(2);
            $scope.validation = {};
            
            $scope.enableEmailNotification = Boolean($scope.user.enableEmailNotification);
            $scope.user.enableEmailNotification = Boolean($scope.user.enableEmailNotification);
            
            UserService.getEmailUserSettings(function (err, result) {
                if (err) {
                    console.log(err);
                    $scope.emailError = true;
                    $scope.emailRespMessage = 'Your email settings cant be load, cause of an error.';
                    return;
                }
                $scope.emailSettings.splice(0, $scope.emailSettings.length);
                $timeout(function () {
                    for (var i = 0; i < result.length; i++) {
                        $scope.emailSettings.push(result[i]);  
                        $scope.toggle[result[i].id] = Boolean(result[i].isEnabled);
                    }
                });
                
            });
        }
        
        $scope.$watch('enableEmailNotification', function (newValue, oldValue) {
            if (typeof newValue === 'undefined') {
                return;   
            }
            if (newValue === oldValue) {
                return;   
            }
            
            UserService.setEnableEmailNotification(newValue, function (err, result) {
                if (err) {
                    $scope.emailError = true;
                    $scope.emailRespMessage = err.data.message;
                    return;
                }
                $scope.emailSuccess = true;
                $scope.emailRespMessage = result.message;
                $scope.refreshUserObject();
                $timeout(function () {
                    $scope.emailSuccess = false;
                }, 2000);
            });
        });
        
        $scope.$watchCollection('toggle', function (newValues, oldValues) {
            if (JSON.stringify(newValues) === JSON.stringify(oldValues)) {
                return;   
            }
            
            var edited = {};
            for (var i in newValues) {
                if (newValues[i] !== oldValues[i]) {
                    if (typeof newValues[i] === 'undefined' || typeof oldValues[i] === 'undefined') {
                        return;   
                    }
                    edited.id = parseInt(i);
                    edited.value = newValues[i];
                }
            }
            
            UserService.setEmailUserSettings(edited, function (err, result) {
                if (err) {
                    $scope.emailError = true;
                    $scope.emailRespMessage = 'Oops a daisy! There went something wrong :/'; 
                    return;
                }
                $scope.emailSuccess = true;
                $scope.emailRespMessage = result.message;
                $scope.refreshUserObject();
                $timeout(function () {
                    $scope.emailSuccess = false;
                }, 2000);
            });
        });
        
        $scope.changeBalanceNotificationLimit = function (newLimit) {
            if (!newLimit) {
                return;   
            }
            
            if (!(new RegExp(/^[-+]?[0-9]+([.,][0-9]{1,2})?$/)).test(newLimit)) {
                $scope.validation.show = true;
                $scope.validation.message = 'Pls enter a valid number.';
                return;
            }
            
            newLimit = parseFloat(newLimit.replace(',', '.'));
            newLimit = parseFloat(Math.round(newLimit * 100) / 100).toFixed(2);
            
            if (parseFloat(Math.round($scope.user.emailCreditLimitForNotification * 100) / 100).toFixed(2) === newLimit) {
                $scope.validation.show = true;
                $scope.validation.message = newLimit + ' € are already assigned.';
                return;   
            }
            
            if (parseFloat(newLimit) < 0) {
                $scope.validation.show = true;
                $scope.validation.message = 'Negativ values are not allowed. Limit should be greater equal than zero';
                return;
            }

            UserService.setEmailCreditLimitForNotification(newLimit, function (err, result) {
                $scope.validation.show = false;
                if (err) {
                    $scope.limitError = true;
                    $scope.limitRespMessage = 'Oops a daisy! There went something wrong :/';
                    $scope.newLimit = '';
                    return;
                }
                $scope.limitSuccess = true;
                $scope.limitError = false;
                $scope.limitRespMessage = result.message;
                $scope.refreshUserObject();
                $scope.newLimit = '';
                $timeout(function () {
                    $scope.limitSuccess = false;
                }, 2000);
            });
        };

        init();
        
}]);
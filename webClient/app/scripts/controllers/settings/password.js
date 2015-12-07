'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('PasswordCtrl', ['$scope', '$timeout', 'UserService', 'UserGroupsService', function ($scope, $timeout, UserService) {
        
        function init() {
            $scope.success = false;
            $scope.error = false;
            $scope.respMessage = '';
            
        }
        
        $scope.updatePassword = function (currPwd, newPwd) {
            if (!currPwd || !newPwd) {
                return;   
            }
            
            $scope.changePassword.$setPristine();
            $scope.currentPassword = '';
            $scope.newPassword = '';
            $scope.confirmPassword = '';
            $scope.changePassword.$setUntouched();
            $scope.clearForm = true;

            UserService.changePassword(currPwd, newPwd, function (err, result) {
                if (err) {
                    $scope.error = true;
                    console.log(err);
                    if(err.data.message.indexOf('Invalid') > -1) {
                        $scope.respMessage = err.data.message;
                    } else {
                        $scope.respMessage = 'Oops a daisy! There went something wrong';
                    }
                    return;
                }
                $scope.error = false;
                $scope.success = true;
                $scope.respMessage = result.message;
            });
        };
        
        init ();
}]);
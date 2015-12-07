'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ActiveCtrl', ['$scope', '$timeout', 'UserService', function ($scope, $timeout, UserService) {

        function init() {

            $scope.isActive = Boolean($scope.user.isActive);
            
            $scope.success = false;
            $scope.error = false;
        }
        
        $scope.$watch('isActive', function (newValue, oldValue) {
            if (typeof newValue === 'undefined') {
                return;   
            }
            if (newValue === oldValue) {
                return;   
            }
            UserService.setIsActive(newValue, function (err, data) {
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = err.data.message;
                    return;   
                }
                $scope.success = true;
                $scope.respMessage = data.message;
                $scope.refreshUserObject();
                
                $timeout(function () {
                    $scope.success = false;
                    $scope.respMessage = '';
                }, 2000);   
            });
            
        });

        init();
}]);
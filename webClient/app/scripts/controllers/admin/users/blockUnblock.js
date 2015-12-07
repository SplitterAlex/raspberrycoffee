'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('BlockUnblockCtrl', ['$scope', '$timeout', 'UserService', function ($scope, $timeout, UserService) {

        function init() {

            $scope.success = false;
            $scope.error = false;
        }
        
        $scope.$on('blockUnblock', function (e, user) {
            $timeout(function () {
                $scope.success = false;
                $scope.error = false;
            });
            $scope.isBlocked = undefined;
            $scope.isBlocked = !Boolean(user.isBlocked);
            $scope.user = user;
            $('#blockUnblockModal').modal('show');
        });
        
        $scope.$on('blockUnblockModalIsHiding', function () {
            $timeout(function () {
                $scope.isBlocked = undefined; 
            });
        });
        
        $scope.$watch('isBlocked', function (newValue, oldValue) {
            if (typeof newValue === 'undefined' || typeof oldValue === 'undefined') {
                return;   
            }
            if (newValue === oldValue) {
                return;   
            }
            
            UserService.setIsBlocked($scope.user.userId, !newValue, function (err, data) {
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = 'Oops-a-daisy! There went something wrong :(';
                    return;   
                }
                $scope.success = true;
                $scope.respMessage = data.message;
                $scope.getUsers();
            });
        });
        
        init();
}]);
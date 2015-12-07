'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('RemoveUserCtrl', ['$scope', '$timeout', 'UserService', function ($scope, $timeout, UserService) {

        function init() {

            $scope.success = false;
            $scope.error = false;
        }
        
        $scope.$on('delete', function (e, user) {
            console.log(e);
            $timeout(function () {
                $scope.success = false;
                $scope.error = false;
            });
            $scope.user = user;
            $('#removeUserModal').modal('show');
        });
        
        
        $scope.remove = function () {
            console.log('remove');
            UserService.deleteUser($scope.user.userId, function (err) {
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = 'Oops-a-daisy! There went something wrong :(';
                    return;   
                }
                $scope.getUsers();
                $('#removeUserModal').modal('hide');
            });
        };
        
        init();
}]);
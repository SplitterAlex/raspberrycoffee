'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UsergroupCtrl', ['$scope', '$timeout', 'UserService', 'UserGroupsService', function ($scope, $timeout, UserService, UserGroupsService) {
        
        function init() {
            $scope.success = false;
            
            $scope.error = false;
            $scope.respMessage = '';
            
            $scope.options = UserGroupsService.getSelectList();
            if ($scope.options.length === 1) {
                UserGroupsService.getUserGroups(function (err) {
                    if (err) {
                        console.log(err);
                        return;   
                    }
                    $scope.options = UserGroupsService.getSelectList();
                    $scope.selectedGroup = $scope.options[0];
                });
            }
            $scope.selectedGroup = $scope.options[0];
        }
        
        $scope.changeUsergroup = function () {
            if (typeof $scope.selectedGroup === 'undefined') {
                return;   
            }
            
            if ($scope.selectedGroup.value === 0) {
                return;
            }
            if ($scope.selectedGroup.value === $scope.user.groupId) {
                return;
            }
            
            UserService.setUserGroup($scope.selectedGroup.value, function (err, result) {
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = 'Oops-a-daisy! There went something wrong :(';
                    return;
                }
                $scope.refreshUserObject();
                $scope.selectedGroup = $scope.options[0];
                $scope.success = true;
                $scope.respMessage = result.message;
                $timeout(function () {
                    $scope.success = false;
                }, 2000);
            });
        };
        
        init ();
}]);
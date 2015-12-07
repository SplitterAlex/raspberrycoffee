'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ControlPanelCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', 'UserService', 'UserGroupsService', 'ClearService', function ($scope, $http, $window, $location, $rootScope, $timeout, UserService, UserGroupsService, ClearService) {
        
        
        
    function init() {
        $('#side-menu').metisMenu();
        Chart.defaults.global.animation= false;
        delete $rootScope.pathToForward;
        $scope.api = {};
        $scope.user = UserService.getLoggedUser();
        $scope.admin = {};
        $scope.admin.isAdmin = $scope.user.isAdmin;
        if ($scope.admin.isAdmin) {
            $scope.admin.adminId = $scope.user.userId;   
        }
        
        $scope.visit = {};
        $scope.visit.actice = false;
        $scope.visit.admin = null;
        
        if ($scope.user.groupId === null) {
            $scope.user.groupName = 'N/A';
            $scope.user.groupShortForm = '';
            return;
        }
    }
    
    $scope.refreshUserObject = function () {
        $timeout(function () {
            $scope.user = UserService.getLoggedUser();
        });   
    };
    
    $scope.visitUser = function (user) {
        UserService.getUser(user.userId, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            $timeout(function () {
                $scope.user = UserService.getLoggedUser();
            });
            $location.path('/controlPanel/dashboard');
            $scope.visit.active = true;
        });
    };

    $scope.quitVisit = function () {
        UserService.getUser($scope.admin.adminId, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            $timeout(function () {
                $scope.user = UserService.getLoggedUser();
            });
            $location.path('/controlPanel/admin/users');
            $scope.visit.active = false;
        });
    };
    
    $scope.logout = function () {
        console.log('logout');
        ClearService.clear();
        $location.path('/');
    };
    
    init();

}]);
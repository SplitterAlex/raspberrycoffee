'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('DashboardCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', 'UserService', function ($scope, $http, $window, $location, $rootScope, $timeout, UserService) {

        
    function init() {
        
        if (UserService.getLoggedUser().groupId === null) {
            $scope.showGroup = false;   
        } else {
            $scope.showGroup = true;   
        }
        
        $scope.user.controlPanel = {};
        UserService.refreshUser(function (err) {
            if (err) {
                return;
            }
            $scope.refreshUserObject();
        });
        
        fetchDashboardDetails();
    }
    
    function fetchDashboardDetails() {
        $http({
            url: '/api/user/' + UserService.getLoggedUser().userId + '/dashboard',
            method: 'GET',
            params: {
                groupId: UserService.getLoggedUser().groupId
            }
        })
        .success(function (data) {
            $scope.globalRankingPlace = data.globalRankingPlace;
            $scope.groupRankingPlace = data.groupRankingPlace;
            $scope.investedMoney = data.investedMoney;
            $scope.count = data.count;
            $scope.mcc = data.mcc;
            $scope.ccc = data.ccc;
        });
    }

    init();
        
}]);
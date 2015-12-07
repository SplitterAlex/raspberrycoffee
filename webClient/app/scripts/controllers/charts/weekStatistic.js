'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('WeekStatisticCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', '$attrs', 'UserService', function ($scope, $http, $window, $location, $rootScope, $timeout, $attrs, UserService) {
        
    function init() {
        $scope.fetchWeeklyStatistic();
    }
    

    $scope.fetchWeeklyStatistic = function () {
        
        if ($scope.loading === true) {
            return;   
        }
        
        $scope.loading = true;
        
        var fromGroup;
        var fromUser;
        
        switch ($attrs.purpose) {
            case 'global':
                break;
            case 'group':
                fromGroup = UserService.getLoggedUser().groupId;
                break;
            case 'user':
                fromUser = UserService.getLoggedUser().userId;
                break;
            default:
                console.log('default consumption ');
        }
        
        $http({
            url: '/api/statistics/weekly',
            method: 'GET',
            params: {
                fromGroup: fromGroup, //groupId from user
                fromUser: fromUser, //userId from user
            }
        })
        .success(function (data) {
            $timeout(function () {
                $scope.datas = data.data;
                $scope.labels = data.labels;
                $scope.series = data.series;
                $scope.data = data.data.Total.concat(data.data.Coffee);
                $scope.item = 'Coffee';
                $scope.dataIndexMap = data.dataIndexMap;
                $scope.error = false;
            }, 100);
        })
        .error(function () {
            $scope.error = true;
        }).finally(function () {
            $scope.loading = false;   
        });
    };
    
    var index = 1;
    $scope.changeWeekView = function () {
        if (index++ === $scope.dataIndexMap.length -1) {
            index = 1;   
        }
        $scope.data = $scope.datas.Total.concat($scope.datas[$scope.dataIndexMap[index]]);
        $scope.item = $scope.dataIndexMap[index];
    };
    
    init();
}]);



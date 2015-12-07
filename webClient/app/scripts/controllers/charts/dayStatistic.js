'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('DayStatisticCtrl', ['$scope', '$http', '$timeout', '$attrs', 'UserService', function ($scope, $http, $timeout, $attrs, UserService) {
        
    function init() {
        $scope.fetchDayStatistic(moment().format('YYYY-MM-DD'), moment().subtract(1, 'days').format('YYYY-MM-DD'));
    }
    
    $scope.setMainDay = function (newDate, oldDate) {
        if (JSON.stringify(newDate) === JSON.stringify(oldDate)) {
            return;   
        }
        
        var date = moment(newDate);
        var mainDay = date.format('YYYY-MM-DD');
        
        if ($scope.selectedSecondDay === mainDay) {
            $scope.sameValues = true;
            return;
        }
        $scope.sameValues = false;
        $scope.selectedMainDay = mainDay;
        
        $scope.fetchDayStatistic(mainDay, $scope.selectedSecondDay);
    };
    
    $scope.setSecondDay = function (newDate, oldDate) {
        if (JSON.stringify(newDate) === JSON.stringify(oldDate)) {
            return;   
        }
        
        var date = moment(newDate);
        var secondDay = date.format('YYYY-MM-DD');
        
        if ($scope.selectedMainDay === secondDay) {
            $scope.sameValues = true;
            return;
        }
        $scope.sameValues = false;
        $scope.selectedSecondDay = secondDay;
        
        $scope.fetchDayStatistic($scope.selectedMainDay, secondDay);
    };
    
    
    $scope.fetchDayStatistic = function (fromMainDay, fromSecondDay) {
        
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
            url: '/api/statistics/daily',
            method: 'GET',
            params: {
                fromGroup: fromGroup, //groupId from user
                fromUser: fromUser, //userId from user
                fromMainDay: fromMainDay,
                fromSecondDay: fromSecondDay
                //startDate: startDate,
                //endDate: endDate
            }
        })
        .success(function (data) {
            $timeout(function () {
                $scope.data = data.data;
                $scope.labels = data.labels;
                $scope.series = data.series;
                $scope.error = false;
                $scope.selectedMainDay = data.series[0];
                $scope.selectedSecondDay = data.series[1];
            }, 100);
        })
        .error(function () {
            $scope.error = true;
        })
        .finally(function () {
            $scope.loading = false;   
        });
    };

    init();
}]);



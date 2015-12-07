'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('MonthStatisticCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', '$attrs', 'UserService', function ($scope, $http, $window, $location, $rootScope, $timeout, $attrs, UserService) {
        
    function init() {
        $scope.fetchMonthlyStatistic(moment().format('YYYY'), moment().subtract(1, 'years').format('YYYY'));
        $scope.sameValues = false;
    }
    
    $scope.setMainYear = function (newDate, oldDate) {
        if (JSON.stringify(newDate) === JSON.stringify(oldDate)) {
            return;   
        }
        
        var date = moment(newDate);
        var mainYear = date.format('YYYY');
        console.log(typeof $scope.selectedSecondYear);
        console.log(typeof mainYear);
        if ($scope.selectedSecondYear === mainYear) {
            $scope.sameValues = true;
            return;
        }
        $scope.sameValues = false;
        $scope.selectedMainYear = date.format('YYYY');
        
        $scope.fetchMonthlyStatistic(mainYear, $scope.selectedSecondYear);
    };
    
    $scope.setSecondYear = function (newDate, oldDate) {
        if (JSON.stringify(newDate) === JSON.stringify(oldDate)) {
            return;   
        }
        
        var date = moment(newDate);
        var secondYear = date.format('YYYY');
        
        if ($scope.selectedMainYear === secondYear) {
            $scope.sameValues = true;
            return;
        }
        $scope.sameValues = false;
        $scope.selectedSecondYear = date.format('YYYY');
        
        $scope.fetchMonthlyStatistic($scope.selectedMainYear, secondYear);
    };
    
    
    $scope.fetchMonthlyStatistic = function (fromMainYear, fromSecondYear) {
        
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
            url: '/api/statistics/monthly',
            method: 'GET',
            params: {
                fromGroup: fromGroup, //groupId from user
                fromUser: fromUser, //userId from user
                fromMainYear: fromMainYear,
                fromSecondYear: fromSecondYear
            }
        })
        .success(function (data) {
            // we need a timeout here, because the chart will not rendered if its already hidden
            // cause of the ng-hide directive. So at first we have to set the ng-hide with the
            // loading paramter at finally, and wait one tick...
            $timeout(function () {
                $scope.data = data.data;
                $scope.series = data.series;
                $scope.labels = data.labels;
                $scope.selectedMainYear = String(data.series[0]);
                $scope.selectedSecondYear = String(data.series[1]);
                $scope.error = false;
                $scope.loading = false;
            }, 100);
        })
        .error(function () {
            $scope.error = true;
        }).finally(function () {
            $scope.loading = false; 
        });
    };
    
    init();
}]);



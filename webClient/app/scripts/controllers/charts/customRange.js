'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('CustomRangeCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', '$attrs', 'UserService', function ($scope, $http, $window, $location, $rootScope, $timeout, $attrs, UserService) {

    function init() {
        
        $scope.dateRangeOptions = {
            dateLimit: { days: 31 },
            format: 'MMMM Do, YYYY',
            eventHandlers: {'apply.daterangepicker': $scope.applyNewRange},
            separator: ' to ',
            ranges: {
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                'Last Year, Last 7 Days': [moment().subtract(1, 'year').subtract(6, 'days'), moment().subtract(1, 'year')],
                'Last Year, Last 30 Days': [moment().subtract(1, 'year').subtract(29, 'days'), moment().subtract(1, 'year')],
                'Last Year, This Month': [moment().subtract(1, 'year').startOf('month'), moment().subtract(1, 'year').endOf('month')],
                'Last Year, Last Month': [moment().subtract(1, 'year').subtract(1, 'month').startOf('month'), moment().subtract(1, 'year').subtract(1, 'month').endOf('month')]
            }
        };
        
        $scope.selectedRange = {startDate: moment().subtract(29, 'days'), endDate: moment()};
        $scope.fetchCustomRange(moment($scope.selectedRange.startDate), moment($scope.selectedRange.endDate));
    }
    
    $scope.applyNewRange = function (ev, picker) {
        $scope.fetchCustomRange(picker.startDate, picker.endDate);
    };
    
    $scope.applyLast30Days = function () {
        $scope.selectedRange.startDate = moment().subtract(29, 'days');
        $scope.selectedRange.endDate = moment();
        $scope.fetchCustomRange(moment().subtract(29, 'days'), moment());
    };
    
    $scope.fetchCustomRange = function (startDate, endDate) {
        if ($scope.loading === true) {
            return;   
        }
        $scope.loading = true;
        
        var fromGroup;
        var fromUser;
        startDate = startDate.format('YYYY-MM-DD');
        endDate = endDate.format('YYYY-MM-DD');
        
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
            url: '/api/statistics/customRange',
            method: 'GET',
            params: {
                fromGroup: fromGroup, //groupId from user
                fromUser: fromUser, //userId from user
                startDate: startDate,
                endDate: endDate
            }
        })
        .success(function (data) {
            $timeout(function () {
                
                $scope.datas = data.data;
                $scope.data = [data.data.Total, data.data.Coffee];
                $scope.item = 'Coffee';
                $scope.dataIndexMap = data.dataIndexMap;
                $scope.error = false;
                
                $scope.labels = data.labels;
                $scope.series = data.series;
            }, 100);
        })
        .error(function () {
            $scope.error = true;
        }).finally(function () {
            $scope.loading = false; 
        });
    };
    
    var index = 1;
    $scope.changeView = function () {
        if (index++ === $scope.dataIndexMap.length -1) {
            index = 1;   
        }
        $scope.data = [$scope.datas.Total, $scope.datas[$scope.dataIndexMap[index]]];
        $scope.item = $scope.dataIndexMap[index];
    };
    
    init();
}]);



'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('CoffeeConsumptionCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', '$attrs', 'UserService', function ($scope, $http, $window, $location, $rootScope, $timeout, $attrs, UserService) {

    var initialized = false;
        
    function init() {
        $scope.dateRangeOptions = {
            format: 'MMMM Do, YYYY',
            eventHandlers: {'apply.daterangepicker': $scope.applyNewRange},
            separator: ' to ',
            ranges: {
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                'This Year': [moment().startOf('year'), moment().endOf('year')],
                'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
                'Last Year, Last 7 Days': [moment().subtract(1, 'year').subtract(6, 'days'), moment().subtract(1, 'year')],
                'Last Year, Last 30 Days': [moment().subtract(1, 'year').subtract(29, 'days'), moment().subtract(1, 'year')],
                'Last Year, This Month': [moment().subtract(1, 'year').startOf('month'), moment().subtract(1, 'year').endOf('month')],
                'Last Year, Last Month': [moment().subtract(1, 'year').subtract(1, 'month').startOf('month'), moment().subtract(1, 'year').subtract(1, 'month').endOf('month')]
            }
        };
        
        
        $scope.fetchCoffeeConsumption();
    }
    
    $scope.applyNewRange = function (ev, picker) {
        
        $scope.fetchCoffeeConsumption(picker.startDate.format('YYYY-MM-DD'), picker.endDate.format('YYYY-MM-DD'));
    };
    
    $scope.fetchCoffeeConsumption = function (startDate, endDate) {
        
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
            url: '/api/statistics/coffeeConsumption',
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
                $scope.data = data.data;
                $scope.total = data.total;
                $scope.labels = data.labels;
                $scope.dateRange = data.dateRange;
                $scope.error = false;
                $scope.loading = false; 
            
                if (!initialized) {
                    initialized = true;
                    $scope.dateMin = data.dateRange.startDate;
                    $scope.dateMax = data.dateRange.endDate;
                }
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



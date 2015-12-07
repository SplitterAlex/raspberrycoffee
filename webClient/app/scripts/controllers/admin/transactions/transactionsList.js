'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('TransactionsCtrl', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
    
        
    function init() {
        
        $scope.dateRangeOptions = {
            format: 'MMM D, YYYY',
            eventHandlers: {'apply.daterangepicker': $scope.applyNewRange},
            separator: ' to ',
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                'This Year': [moment().startOf('year'), moment().endOf('year')],
                'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
            }
        };
        
        $scope.defaultButtonIsActive = true;
    
        $scope.list = [];
        
        $scope.displayRange = {};
        $scope.displayRange.startDate = moment().format('MMMM D, YYYY');
        $scope.displayRange.endDate = moment().format('MMMM D, YYYY');
        
        $scope.error = {};
        $scope.error = false;
        $scope.respMessage = '';
        
        $scope.fetchTransactions();
    }
    
    $scope.applyNewRange = function (ev, picker) {
        if ($scope.loading) {
            return;   
        }
        $scope.displayRange.startDate = picker.startDate.format('MMMM D, YYYY');
        $scope.displayRange.endDate = picker.endDate.format('MMMM D, YYYY');
        $scope.fetchTransactions(picker.startDate.format('YYYY-MM-DD'), picker.endDate.format('YYYY-MM-DD'));
    };
    
    $scope.fetchTransactions = function (startDate, endDate) {
        
        if ($scope.loading) {
            return;   
        }
        
        $scope.loading = true;
        
        $http({
            url: '/api/admin/transactions', 
            method: 'GET',
            params: {
                startDate: startDate,
                endDate: endDate
            }
        })
        .success(function (data) {
            $scope.list.splice(0, $scope.list.length);
            for (var i = 0; i < data.length; i++) {
                $scope.list.push(data[i]);  
            }
            $scope.predicate= '-id';
            $scope.loading = false;
            $scope.error = false;
        })
        .error(function (data) {
            $scope.error = true;
            $scope.respMessage = data.code + ': ' + data.message;    

        }).finally(function () {
            $timeout(function () {
                $scope.loading = false; 
            }, 50);
        });
    };
    
    init();
        
}]);
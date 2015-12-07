'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('YourTransactionsCtrl', ['$scope', '$timeout', 'UserTransactionService', 'UserKeyService', 'TransactionPurposeService', function ($scope, $timeout, UserTransactionService, UserKeyService, TransactionPurposeService) {
    
        
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
        
        UserTransactionService.emptyFilter();
        UserKeyService.clear();
        $scope.keys = UserKeyService.list();
        $scope.purposes = TransactionPurposeService.list();
    
        $scope.list = UserTransactionService.list();
        
        $scope.filter = {};
        $scope.filter.purposes = [];
        $scope.filter.keys = [];
        
        $scope.selectedRange = {};
        $scope.displayRange = {};
        
        $scope.page = 0;
        
        $scope.error = {};
        $scope.error = false;
        $scope.respMessage = '';
        
        if ($scope.purposes.length === 0) {
            TransactionPurposeService.getTransactionPurposes(function (err) {
                if (err) {
                    console.log(err);   
                }
                //console.log(data);
            });   
        }

        UserKeyService.getKeys(function (err) {
            if (err) {
                console.log(err);
            }
        });   
         
        $scope.applyLast7Days();
    }
    
    $scope.applyNewRange = function (ev, picker) {
        if ($scope.loading) {
            return;   
        }
        UserTransactionService.setRange(picker.startDate.format('YYYY-MM-DD'), picker.endDate.format('YYYY-MM-DD'));
        $scope.displayRange.startDate = picker.startDate.format('MMMM D, YYYY');
        $scope.displayRange.endDate = picker.endDate.format('MMMM D, YYYY');
        $scope.fetchTransactions();
    };
    
    $scope.applyLast7Days = function () {
        if ($scope.loading) {
            return;   
        }
        $scope.displayRange.startDate = moment().subtract(6, 'days').format('MMMM D, YYYY');
        $scope.displayRange.endDate = moment().format('MMMM D, YYYY');
        UserTransactionService.setRange(moment().subtract(6, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD'));
        $scope.fetchTransactions();
    };
    
    $scope.activateFilter = function () {
        $scope.page = 0;
        var filter = [];
        
        var i;
        for (i = 0; i < $scope.filter.purposes.length; i++) {
            if ($scope.filter.purposes[i] !== 0) {
                console.log($scope.filter.purposes[i]);
                filter.push({type: 'purpose', value: $scope.filter.purposes[i]});
            }
        }
        for (i = 0; i < $scope.filter.keys.length; i++) {
            if ($scope.filter.keys[i] !== 0) {
                   filter.push({type: 'key', value: $scope.filter.keys[i]});
            }
        }
        
        UserTransactionService.setFilter.apply(null, filter);
        $scope.fetchTransactions();
    };
    
    $scope.fetchTransactions = function () {
        
        if ($scope.loading) {
            console.log('loading');
            return;   
        }
        
        $scope.loading = true;
        
        UserTransactionService.getTransactions(function (err) {
            $timeout(function () {
                $scope.loading = false;
            }, 50);
            
            if (err) {
                $scope.error = true;
                $scope.respMessage = err.data.message;
                return;
            }
            $scope.error = false;
        });
    };
    
    $scope.next = function () {
        UserTransactionService.setPosition(UserTransactionService.position() + 30);
        UserTransactionService.getTransactions(function (err) {
            if (err) {
                $scope.error = true;
                $scope.respMessage = err.data.message; 
                return;
            }
            $scope.page++; 
        });
    };
    
    $scope.back = function () {
        var pos = UserTransactionService.position();
        UserTransactionService.setPosition(pos - (pos % 30) - 30);
        UserTransactionService.getTransactions(function (err) {
            if (err) {
                $scope.error = true;
                $scope.respMessage = err.data.message;
                return;
            }
            $scope.page--;
        });
    };
    
    init();
        
}]);
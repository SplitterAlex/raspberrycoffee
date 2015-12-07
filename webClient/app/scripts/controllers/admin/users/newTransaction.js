'use strict';

/**
 * @ngdoc function
 * @name 
 * @description
 * # NewBookingCtrl
 */
angular.module('clientApp').controller('newTransactionCtrl', ['$scope', '$timeout', '$filter', 'UserService', 'TransactionPurposeService', function ($scope, $timeout, $filter, UserService, TransactionPurposeService) {

        
        function init() {

            $scope.newTransaction = {};
            $scope.purposes = TransactionPurposeService.getSelectList();
            if ($scope.purposes.length === 1) {
                TransactionPurposeService.getTransactionPurposes(function (err) {
                    if (err) {
                        console.log(err);   
                    }
                    $scope.purposes = TransactionPurposeService.getSelectList();
                    $scope.newTransaction.selectedPurpose = $scope.purposes[0];
                });
            }
            $scope.newTransaction.selectedPurpose = $scope.purposes[0];
        }
        
        $scope.$on('startNewTransaction', function(e, user) {
            $timeout(function () {
                $scope.success = false;
                $scope.error = false;
            });
            $scope.newTransaction.selectedPurpose = $scope.purposes[0];
            $scope.newTransaction.amount = '';
            $scope.newTransaction.quantity = 1;
            
            $scope.newTransaction.recipient = user;
            $scope.newTransaction.note = '';
            $scope.newTransaction.date = moment().format('YYYY-MM-DD HH:mm:ss');
            $('#newTransactionModal').modal('show');
        });
        
        $scope.completeNewTransaction = function (newTransaction) {
            UserService.newTransaction(newTransaction, function (err, data) {
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = err.data.code + ': ' + err.data.message;
                    return;
                }
                $scope.success = true;
                $scope.error = false;
                $scope.respMessage = data.message;
                $scope.newTransaction.selectedPurpose = $scope.purposes[0];
                $scope.newTransaction.quantity = 1;
                $scope.newTransaction.date = moment().format('YYYY-MM-DD HH:mm:ss');
                $scope.getUsers();
            });
        };
        
        $scope.setTransactionDate = function (newDate) {
            if (typeof newDate === 'undefined') {
                return;   
            }
            $scope.newTransaction.date = moment(newDate).format('YYYY-MM-DD HH:mm:ss');
        };

        init();
}]);
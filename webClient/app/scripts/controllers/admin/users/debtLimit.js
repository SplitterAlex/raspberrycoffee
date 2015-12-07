'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('DebtLimitCtrl', ['$scope', '$timeout', 'UserService', function ($scope, $timeout, UserService) {

        function init() {
            $scope.user.debtLimit = parseFloat($scope.user.debtLimit * 100 / 100).toFixed(2);
            $scope.validation = {};
        }
        
        $scope.changeDebtLimit = function (user, newDebtLimit) {
            if (!newDebtLimit) {
                return;   
            }
            
            if (!(new RegExp(/^[-+]?[0-9]{1,}([.,][0-9]{1,2})?$/)).test(newDebtLimit)) {
                $scope.validation.show = true;
                $scope.validation.message = 'Pls enter a valid number.';
                return;
            }
            
            newDebtLimit = parseFloat(newDebtLimit.replace(',', '.'));

            if (parseFloat(Math.round(user.debtLimit * 100) / 100).toFixed(2) === parseFloat(Math.round(newDebtLimit * 100) / 100).toFixed(2)) {
                $scope.validation.show = true;
                $scope.validation.message = newDebtLimit + ' € are already assigned.';
                return;   
            }
            
            if (parseFloat(newDebtLimit) < 0) {
                $scope.validation.show = true;
                $scope.validation.message = 'Negativ values are not allowed. Debt limits are always considered as negativ values';
                return;
            }
            
            UserService.setDebtLimit(user.userId, newDebtLimit, function (err, result) {
                $scope.validation.show = false;
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = err.data.message;
                    return;
                }
                $scope.success = true;
                $scope.respMessage = result.message;
                $scope.newDebtLimit = '';
                $scope.user.debtLimit = parseFloat(Math.round(result.newDebtLimit * 100) / 100).toFixed(2);
                $scope.getUsers();
            });
        };
        
        $scope.$on('editDebtLimit', function (e, user) {
            $scope.user = user;
            $scope.user.debtLimit = parseFloat($scope.user.debtLimit * 100 / 100).toFixed(2);
            $scope.newDebtLimit = '';
            $timeout(function () {
                $scope.success = false;
                $scope.error = false;
            });
            $('#editDebtLimitModal').modal('show');
        });
        
        
        init();
         
}]);
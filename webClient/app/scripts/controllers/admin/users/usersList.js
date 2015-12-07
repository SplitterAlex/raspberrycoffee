'use strict';

/**
 * @ngdoc function
 * @name 
 * @description
 * # NewBookingCtrl
 */
angular.module('clientApp').controller('UsersListCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', '$timeout', 'UserService', function ($scope, $http, $window, $location, $rootScope, $timeout, UserService) {

        
        function init() {

            
            $scope.searchString = '';
            $scope.list = [];
            $scope.balanceSum = 0;
            $scope.getUsers();
            initBlockUnblockModalCloseHandler();
        }
        
        $scope.$watch('searchString', function () {
            if (!$scope.usersFilterForm.$dirty) {
                return;   
            }
            if (!$scope.usersFilterForm.$valid) {
                return;   
            }
            $scope.getUsers();
            
        });
        
        $scope.startNewTransaction = function (user) {
            $scope.$broadcast('startNewTransaction', user);
        };
        
        $scope.editDebtLimit = function (user) {
            $scope.$broadcast('editDebtLimit', user);  
        };
        
        $scope.blockUnblock = function (user) {
            $scope.$broadcast('blockUnblock', user);   
        };
        
        $scope.visit = function (user) {
            $scope.visitUser(user);
        };
        
        $scope.delete = function (user) {
            console.log(user);
            $scope.$broadcast('delete', user);
        };
        
        $scope.getUsers = function () {
            UserService.getUsers($scope.searchString, function (err, users) {
                if (err) {
                    $scope.list = [];
                    $scope.error = true;
                    $scope.respMessage = err.data.message;
                    return;
                }
                $scope.error = false;
                $scope.list = users;
            });
        };
        
        $scope.castToFloat = function (user) {
            return parseFloat(user.currentDeposit);   
        };
        
        function initBlockUnblockModalCloseHandler () {
            $('#blockUnblockModal').on('hide.bs.modal', function () {
                $scope.$broadcast('blockUnblockModalIsHiding');
            });   
        }
        
        init();
}]);
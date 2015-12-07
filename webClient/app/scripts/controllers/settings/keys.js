'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('KeysCtrl', ['$scope', 'UserKeyService', function ($scope,  UserKeyService) {
        
        function init() {
            UserKeyService.clear();
            $scope.keys = UserKeyService.list();
            
            $scope.error = {};
            $scope.error.show = false;
            $scope.error.message = 'There are no keys linked to your account.';
            
            $scope.newKey = '';

            UserKeyService.getKeys(function (err) {
                if (err) {
                    $scope.error.show = true;
                    $scope.error.message = err.data.message;  
                }
            });   
        }
            
        $scope.deleteKey = function (keyId) {
            UserKeyService.deleteKey(keyId, function (err) {
                if (err) {
                    $scope.error.show = true;
                    $scope.error.message = err.data.message;
                    return;
                }
                $scope.error.message = 'There are no keys linked to your account.';
            });
        };
        
        $scope.saveKey = function () {
            $scope.error.show = false;
            UserKeyService.saveKey($scope.newKey, function (err) {
                if (err) {
                    $scope.error.show = true;
                    $scope.error.message = err.data.message;
                    return;
                }
                $scope.error.message = 'There are no keys linked to your account.';
                $scope.newKey = '';
            });
        };
            
        init();
        
        
}]);
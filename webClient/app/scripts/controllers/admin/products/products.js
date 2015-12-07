'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductsCtrl', ['$scope', '$http', '$timeout', 'TransactionPurposeService', function ($scope, $http, $timeout, TransactionPurposeService) {
    
        
    function init() {
        
    
        $scope.list = TransactionPurposeService.list();
        
        $scope.predicate='id';
        $scope.form = {};
        
        
        $scope.error = false;
        $scope.respMessage = '';
        
        if (!$scope.list.length) {
            TransactionPurposeService.getTransactionPurposes(function (err) {
                if (err) {
                    $scope.error = true;
                    return;
                }
            });
        }
    }
    
    $scope.startNewProduct = function () {
        $scope.modalError = false;
        $scope.modalSuccess= false;
        $scope.action = $scope.storeNewProduct;
        $scope.form = {};
        $scope.form.name = '';
        $scope.form.productNumber = '';
        $scope.form.price = '';
        $('#productModal').modal('show'); 
    };
    
    $scope.startEditProduct = function (product) {
        $scope.modalError = false;
        $scope.modalSuccess= false;
        $scope.action = $scope.saveEditedProduct;
        $scope.form.name = product.name;
        $scope.form.productNumber = product.productNumber;
        $scope.form.price = product.price;
        $scope.form.id = product.id;
        $('#productModal').modal('show');   
    };
    
    $scope.saveEditedProduct = function (product) {
        product.productNumber = parseInt(product.productNumber);
        TransactionPurposeService.editTransactionPurpose(product, function (err, result) {
            if (err) {
                $scope.modalError = true;
                $scope.respMessage = err.data.code + ': ' + JSON.stringify(err.data);
                return;
            }
            $scope.modalError = false;
            $scope.modalSuccess= true;
            $scope.respMessage = result.message;
        });
    };
    
    $scope.storeNewProduct = function (product) {
        product.productNumber = parseInt(product.productNumber);
        TransactionPurposeService.addNewTransactionPurpose(product, function (err, result) {
            if (err) {
                $scope.modalError = true;
                $scope.respMessage = JSON.stringify(err.data);
                return;
            }
            $scope.modalError = false;
            $scope.modalSuccess= true;
            $scope.respMessage = result.message;
        });
    };
    
    init();
    
}]);

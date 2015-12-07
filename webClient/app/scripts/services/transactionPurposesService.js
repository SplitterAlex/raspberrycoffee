'use strict';



angular.module('clientApp').service('TransactionPurposeService', [ '$resource', function ($resource) {
    
    
    var TransactionPurposeResource = $resource('/api/transactionPurposes/:id', {}, {
        update: {
            method: 'PUT'
        }
    });
    
    
    var transactionPurposes = [];
    
    this.list = function () {
        return transactionPurposes;   
    };
    
    this.getTransactionPurposes = function (callback) {
        TransactionPurposeResource.query(function (data) {
            transactionPurposes.splice(0, transactionPurposes.length);
            for (var i = 0; i < data.length; i++) {
                transactionPurposes.push(data[i]);  
            }
            //userGroups = data;
            callback (null, data);
        }, function (err) {
            callback(err);
        });
    };
    
    this.getTransactionPurposeById = function (id) {
        for (var i = 0; i < transactionPurposes.length; i++) {
            if (transactionPurposes[i].id === parseInt(id)) {
                return transactionPurposes[i];   
            }
        }
        return {id: 0, name: 'no match found', price: null};
    };
    
    this.editTransactionPurpose = function (transactionPurpose, callback) {
        TransactionPurposeResource.update({id: transactionPurpose.id}, transactionPurpose, function (result) {
            for (var i in transactionPurposes) {
                if (transactionPurposes[i].id === parseInt(transactionPurpose.id)) {
                    transactionPurposes[i].productNumber = transactionPurpose.productNumber;
                    transactionPurposes[i].name = transactionPurpose.name;
                    transactionPurposes[i].price = transactionPurpose.price;
                    break;
                }
            }
            callback (null, result);
        }, function (err) {
            callback(err);
        });
    };
    
    this.addNewTransactionPurpose = function (newTransactionPurpose, callback) {
        TransactionPurposeResource.save(newTransactionPurpose,
            function (result) {
                transactionPurposes.push(result.transactionPurpose);
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );
    };
    
    this.getSelectList = function () {
        var selectList = [];
        selectList.push({label: 'Choose a purpose', value: null});
        
        $.each(transactionPurposes, function(i, item) {
            selectList.push({label: item.name, value: item.id});
        });
        return selectList;
    };
    
    this.clear = function () {
        transactionPurposes.splice(0, transactionPurposes.length);   
    };
    
}]);
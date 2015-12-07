'use strict';


angular.module('clientApp').service('UserTransactionService', ['$resource', 'UserService', function ($resource, UserService) {

    //$resource ist hier vllt zu viel des guten. $http genugt bestimmt auch
    var UserTransactionResource = $resource('/api/user/:id/transaction/:pos');
    
    var transactions = {};
    transactions.list = [];
    transactions.position = 0;
    transactions.queryParams = {};
    transactions.startDate = null;
    transactions.endDate = null;
    
    this.list = function () {
        return transactions.list;   
    };
    
    this.position = function () {
        return transactions.position;   
    };
    
    this.setPosition = function (pos) {
        transactions.position = pos;
    };
    
    this.getTransactions = function (callback) {
        transactions.queryParams.id = UserService.getLoggedUser().userId;
        transactions.queryParams.pos = transactions.position;
        transactions.queryParams.startDate = transactions.startDate;
        transactions.queryParams.endDate = transactions.endDate;
        
        UserTransactionResource.query(transactions.queryParams,
            function (result) {
                transactions.list.splice(0, transactions.list.length);
                for (var i = 0; i < result.length; i++) {
                    transactions.list.push(result[i]);
                    //console.log(result[i]);
                }
                callback();
            }, function (err) {
                transactions.list.splice(0, transactions.list.length);
                callback(err);
            }
        );
    };
    
    this.setRange = function (startDate, endDate) {
        transactions.startDate = startDate;
        transactions.endDate = endDate;
    };
    
    this.setFilter = function () {
        
        //delete old query
        transactions.queryParams = {};
        transactions.queryParams.purpose = [];
        transactions.queryParams.key = [];
        transactions.position = 0;
        
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i].type === 'purpose') {
                transactions.queryParams.purpose.push(arguments[i].value);
            } else if (arguments[i].type === 'key') {
                transactions.queryParams.key.push(arguments[i].value);   
            }
        }
    };
    
    this.clear = function () {
        transactions.list.splice(0, transactions.list.length);
        transactions.position = 0;
        transactions.queryParams = {};
    };
    
    this.emptyFilter = function () {
        transactions.queryParams = {};
        transactions.position = 0;
    };
    
}]);
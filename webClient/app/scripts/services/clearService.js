'use strict';

angular.module('clientApp').service('ClearService', ['$window', 'TransactionPurposeService', 'UserService', 'UserGroupsService', 'UserKeyService', 'UserTransactionService', function($window, TransactionPurposeService, UserService, UserGroupsService, UserKeyService, UserTransactionService) {
    
    this.clear = function () {
        TransactionPurposeService.clear();
        UserService.clear();
        UserGroupsService.clear();
        UserKeyService.clear();
        UserTransactionService.clear();
        delete $window.localStorage.token;
    };
    
}]);

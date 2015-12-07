'use strict';


angular.module('clientApp').factory('UserResource', ['$resource', function ($resource) {
    
    return $resource('', 
        {},
        {
        get: {method: 'GET', isArray:false, url: '/api/user/:id'},
        query: {method: 'GET', isArray:true, url: '/api/user'}, //admins only
        setIsBlocked: {method: 'PUT', isArray:false, url: '/api/user/:id/isBlocked'}, //admins only
        setGroupId: {method: 'PUT', isArray:false, url: '/api/user/:id/groupId'},
        setIsActive: {method: 'PUT', isArray:false, url: '/api/user/:id/isActive'},
        setTimestampSetting : {method: 'PUT', isArray:false, url: '/api/user/:id/timeStampPrivatelySetting'},
        setDebtLimit : {method: 'PUT', isArray:false, url: '/api/user/:id/debtLimit'}, //admins only
        newTransaction: {method: 'POST', url: '/api/user/:id/transaction'},
        setShowNameInRanking: {method: 'PUT', url: '/api/user/:id/showNameInRanking'},
        getEmailUserSettings: {method: 'GET', isArray:true, url: '/api/user/:id/emailSettings'},
        setEnableEmailNotification: {method: 'PUT', isArray:false, url: '/api/user/:id/enableEmailNotification'},
        setEmailUserSettings: {method: 'PUT', isArray:false, url: '/api/user/:id/emailSettings'},
        setEmailCreditLimitForNotification: {method: 'PUT', isArray:false, url: '/api/user/:id/emailCreditLimitForNotification'},
        changePassword: {method: 'PUT', isArray:false, url: '/api/user/:id/changePassword'},
        deleteUser: {method: 'DELETE', url: '/api/user/:id/delete'} //admins only
        }
    );
}]);



angular.module('clientApp').service('UserService', ['UserResource', 'UserGroupsService', function(UserResource, UserGroupsService) {

    var loggedUser = {};
    
    this.getLoggedUser = function () {
        return loggedUser;   
    };
    
    this.getUser = function (userId, callback) {
        UserResource.get({id: userId},
            function (user) {
                loggedUser = user;
                loggedUser.currentDeposit = parseFloat(Math.round(loggedUser.currentDeposit * 100) / 100).toFixed(2);
                callback();
            }, function (err) {
                callback(err);
            }
        );   
    };
    
    this.refreshUser = function (callback) {
        UserResource.get({id: loggedUser.userId},
            function (user) {
                loggedUser = user;
                loggedUser.currentDeposit = parseFloat(Math.round(loggedUser.currentDeposit * 100) / 100).toFixed(2);
                callback(null, user);
            }
        );   
    };
    
    this.getUserId = function () {
        return loggedUser.userId;   
    };
    
    this.getUsers = function (searchString, callback) {
        UserResource.query({search: searchString},
            function (data) {
                callback(null, data);
            }, function (err) {
                callback(err);    
            }
        );
    };
    
    this.setIsBlocked = function (userId, isBlocked, callback) {
        UserResource.setIsBlocked({id: userId}, {isBlocked: isBlocked},
            function (data) {
                callback(null, data);
            }, function (err) {
                callback(err);
            }
        );   
    };
    
    this.setUserGroup = function (groupId, callback) {
        UserResource.setGroupId({id: loggedUser.userId}, {groupId: groupId}, function (result) {
            UserGroupsService.getUserGroupById(groupId, function (err, userGroup) {
                if (err) {
                    console.log(err);   
                }
                loggedUser.groupId = groupId;
                loggedUser.groupName = userGroup.name;
                loggedUser.groupShortForm = userGroup.shortForm;
                callback(null, result);
            });   
        }, function (err) {
            callback(err); 
        });   
    };
    
    this.setIsActive = function (isActive, callback) {
        UserResource.setIsActive({id: loggedUser.userId}, {isActive: isActive},
            function (result) {
                loggedUser.isActive = isActive;
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );   
    };
    
    this.clear = function () {
        loggedUser = {};   
    };
    
    this.newTransaction = function (newOrder, callback) {
        
        var postData = {
            tDate: newOrder.date,
            fromTaker: loggedUser.userId,
            toDepositor: newOrder.recipient.userId,
            amount: newOrder.amount,
            note: newOrder.note,
            purposeId: newOrder.selectedPurpose.value,
            quantity: newOrder.quantity
        };
        
        UserResource.newTransaction({id: newOrder.recipient.userId}, JSON.stringify(postData),
            function (result) {
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );
    };
    
    this.setTimestampSetting = function (timestampSetting, callback) {
        UserResource.setTimestampSetting({id: loggedUser.userId}, {timestampSetting: timestampSetting},
            function (result) {
                loggedUser.timeStampPrivatelySetting = timestampSetting;
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );
    };
    
    this.setShowNameInRanking = function (rankingSetting, callback) {
        UserResource.setShowNameInRanking({id: loggedUser.userId}, {showNameInRanking: rankingSetting},
            function (result) {
                loggedUser.showNameInRanking = rankingSetting;
                callback(null, result);
            }, function (err) {
                callback(err);  
            }
        );   
    };
    
    this.setDebtLimit = function (userId, debtLimit, callback) {
        UserResource.setDebtLimit({id: userId}, {debtLimit: debtLimit},
            function (result) {
                callback (null, result);
            }, function (err) {
                callback(err);
            }
        );
    };
    
    this.getEmailUserSettings = function (callback) {
        UserResource.getEmailUserSettings({id: loggedUser.userId},
            function (result) {
                callback(null, result);
            }, function (err) {
                callback(err);    
            }
        );   
    };
    
    this.setEmailUserSettings = function (newSetting, callback) {
        UserResource.setEmailUserSettings({id: loggedUser.userId}, newSetting,
            function (result) {
                callback(null, result);
            }, function (err) {
                callback(err);    
            }
        );   
    };
    
    this.setEnableEmailNotification = function (value, callback) {
        UserResource.setEnableEmailNotification({id: loggedUser.userId}, {enableEmailNotification: value},
            function (result) {
                loggedUser.enableEmailNotification = !loggedUser.enableEmailNotification;
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );   
    };
    
    
    this.setEmailCreditLimitForNotification = function (newLimit, callback) {
        UserResource.setEmailCreditLimitForNotification({id: loggedUser.userId}, {emailCreditLimitForNotification: newLimit},
            function (result) {
                loggedUser.emailCreditLimitForNotification = parseFloat(Math.round(result.newLimit * 100) / 100).toFixed(2);
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );   
    };
    
    this.changePassword = function (currPwd, newPwd, callback) {
        UserResource.changePassword({id: loggedUser.userId}, {currentPassword: currPwd, newPassword: newPwd, username: loggedUser.username},
            function (result) {
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );   
    };
    
    this.deleteUser = function (userId, callback) {
        UserResource.deleteUser({id: userId}, function (result) {
            callback(null, result);
        }, function (err) {
            callback(err);
        });
    };
}]);

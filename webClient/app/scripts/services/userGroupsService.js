'use strict';



angular.module('clientApp').service('UserGroupsService', [ '$resource', function ($resource) {
    
    
    var RESTService = $resource('/api/userGroups/:id', {}, {
        statistic: {method: 'GET', isArray:false, url: '/api/userGroups/statistic'}, //admins only
        update: { method: 'PUT' }
    });
    
    
    var userGroups = [];
    
    this.list = function () {
        return userGroups;   
    };
    
    this.getUserGroupsStatistic = function (callback) {
        RESTService.statistic(function (data) {
            callback(null, data);
        }, function (err) {
            callback(err); 
        });  
    };
    
    this.getUserGroups = function (callback) {
        RESTService.query(function (data) {
            userGroups.splice(0, userGroups.length);
            for (var i = 0; i < data.length; i++) {
                userGroups.push(data[i]);  
            }
            //userGroups = data;
            callback (null, data);
        }, function (err) {
            callback(err);
        });
    };
    
    this.getUserGroupById = function (id, callback) {

        for (var i in userGroups) {
            if (userGroups[i].id === id) {
                return callback(null, userGroups[i]);   
            }
        }
        console.log('usergroup with id: ' + id + ' doesnt find locally');
        //user group with id not found locally. check server...
        RESTService.get({id: id},
            function (userGroup) {
                //userGroup found, store locally
                userGroups.push(userGroup);
                callback(null, userGroup);
            }, function (err) {
                callback(err);
            }
        );
    };
    
    this.addNewUserGroup = function (newUserGroup, callback) {
        RESTService.save(newUserGroup,
            function (result) {
                userGroups.push(result.usergroup);
                callback(null, result);
            }, function (err) {
                callback(err);
            }
        );
    };
    /*
    this.deleteUserGroup = function (id, callback) {
        RESTService.delete({id: id},
            function (userGroup) {
                //remove user group from local storage
                for (var i in userGroups) {
                    if (userGroups[i].id === id) {
                        userGroups.splice(i, 1);
                        break;
                    }
                }
                callback(null, userGroup);
            }, function (err) {
                callback(err);
            }
        );
    };*/
    
    this.editUserGroup = function (userGroup, callback) {
        RESTService.update({id: userGroup.id}, userGroup,
            function (result) {
                //update user group at local array
            
                for (var i in userGroups) {
                    if (userGroups[i].id === parseInt(userGroup.id)) {
                        userGroups[i].id = userGroup.id;
                        userGroups[i].name = userGroup.name;
                        userGroups[i].shortForm = userGroup.shortForm;
                        break;
                    }
                }
                return callback(null, result);
            
            }, function (err) {
                return callback(err);
            }
        ); 
    };
    
    this.getSelectList = function () {
        var selectList = [];
        selectList.push({label: 'Choose a group', value: 0});

        $.each(userGroups, function(i, item) {
            //console.log(item);
            selectList.push({label: item.name, value: item.id});
        });
        return selectList;
    };
    
    this.clear = function () {
        userGroups.splice(0, userGroups.length);   
    };
}]);
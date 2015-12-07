'use strict';

angular.module('clientApp').service('DefaultNotesService', ['$http', function($http) {
    
    var defaultNotes = [];
    
    this.list = function () {
        return defaultNotes;   
    };
    
    this.fetchDefaultNotesFromServer = function (callback) {
        return $http({
            url: '/api/client/defaultNotes',
            method: 'GET'
        }).success(function (data) {
            for (var i = 0; i < data.length; i++) {
                defaultNotes.push(data[i]);  
            }
            callback();
        }).error(function (err) {
            callback(err);
            console.log(err);   
        });
    };
    
    this.getDefaultNoteById = function (id) {
        for (var i = 0; i < defaultNotes.length; i++) {
            if (defaultNotes[i].id === parseInt(id)) {
                return defaultNotes[i].msg;   
            }
        }
    };
    
}]);
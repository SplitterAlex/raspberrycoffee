'use strict';

angular.module('clientApp').service('RankingService', ['$http', function($http) {
    
    var rankings = {
        users: [],
        groups: []
    };
    
    this.fetchUserRanking = function (fromGroup, fromYear, fromMonth) {
        return $http({
            url: '/api/statistics/rankings/users',
            method: 'GET',
            params: {
                fromGroup: fromGroup, //groupId from user
                fromYear: fromYear,
                fromMonth: fromMonth
            }
        
        })
        .success(function (data) {
            rankings.users.splice(0, rankings.users.length);
            for (var i = 0; i < data.length; i++) {
                rankings.users.push(data[i]);  
            }
        });
    };
    
    this.fetchGroupRanking = function (fromYear, fromMonth) {
        return $http({
            url: '/api/statistics/rankings/groups',
            method: 'GET',
            params: {
                fromYear: fromYear,
                fromMonth: fromMonth
            }
        
        })
        .success(function (data) {
            rankings.groups.splice(0, rankings.groups.length);
            for (var i = 0; i < data.length; i++) {
                rankings.groups.push(data[i]);  
            }
        });
    };
    
    this.getRankings = function () {
        return rankings;   
    };
    
}]);
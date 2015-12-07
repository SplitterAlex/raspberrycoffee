'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('RankingsCtrl', ['$scope', '$http', '$timeout', '$attrs', '$q', 'UserService', 'RankingService', function ($scope, $http, $timeout, $attrs, $q, UserService, RankingService) {

        
    function init() {
        
        $scope.rankingUsers = (RankingService.getRankings()).users;
        $scope.rankingGroups = (RankingService.getRankings()).groups;
        
        $scope.error = false;
        
        $scope.rankingAllTime();
    }
    
    $scope.rankingAllTime = function () {
        if($scope.selectedPill === 1) {
            return;   
        }
        
        if ($scope.loading === true) {
            return;   
        }
        
        $scope.loading = true;
        
        var reqToComplete = [];
        
        if ($attrs.isGlobal !== 'yes') {
            reqToComplete.push(RankingService.fetchUserRanking(UserService.getLoggedUser().groupId));
        } else {
            reqToComplete.push(RankingService.fetchUserRanking());
            reqToComplete.push(RankingService.fetchGroupRanking());
        }
        
        $q.all(reqToComplete).then(
            function () {
                $scope.error = false;
                $scope.rankingSelectedYear = '';
                $scope.rankingSelectedMonth = '';
                $scope.selectedPill = 1;
            },
            function () {
                $scope.error = true;
            }).then(
                function () {
                    $scope.loading = false;
                }
            );
    };
    
    $scope.rankingYearSet = function (newDate) {
        if (typeof newDate === 'undefined') {
            return;   
        }
        
        if ($scope.loading === true) {
            return;   
        }
        
        $scope.loading = true;
       
        var date = moment(newDate);
        var year = date.format('YYYY');
        
        var reqToComplete = [];
        
        if ($attrs.isGlobal !== 'yes') {
            reqToComplete.push(RankingService.fetchUserRanking(UserService.getLoggedUser().groupId), year);
        } else {
            reqToComplete.push(RankingService.fetchUserRanking(null, year));
            reqToComplete.push(RankingService.fetchGroupRanking(year));
        }
        
        $q.all(reqToComplete).then(
            function () {
                $scope.error = false;
                $scope.selectedPill = 3; 
                $scope.rankingSelectedYear = year;
                $scope.rankingSelectedMonth = '';
            },
            function () {
                $scope.error = true;  
            }).then(
                function () {
                    $scope.loading = false;
                }
            );
    };
    
    $scope.rankingMonthSet = function (newDate) {
        if (typeof newDate === 'undefined') {
            return;   
        }
        
        if ($scope.loading === true) {
            return;   
        }
        
        $scope.loading = true;
        
        var date = moment(newDate);
        var year = date.format('YYYY');
        var month = date.format('MM');
        
        
        var reqToComplete = [];
        
        if ($attrs.isGlobal !== 'yes') {
            reqToComplete.push(RankingService.fetchUserRanking(UserService.getLoggedUser().groupId, year, month));
        } else {
            reqToComplete.push(RankingService.fetchUserRanking(null, year, month));
            reqToComplete.push(RankingService.fetchGroupRanking(year, month));
        }
        
        
        $q.all(reqToComplete).then(
            function () {
                $scope.error = false;
                $scope.selectedPill = 2; 
                $scope.rankingSelectedMonth = date.format('YYYY-MM');
                $scope.rankingSelectedYear = '';
            },
            function () {
                $scope.error = true;
            }).then(
                function () {
                    $scope.loading = false;
                }
            );
        
    };
    
    init();
}]);



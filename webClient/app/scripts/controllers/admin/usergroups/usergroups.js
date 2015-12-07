'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UsergroupsCtrl', ['$scope', '$http', '$timeout', 'UserGroupsService', function ($scope, $http, $timeout, UserGroupsService) {
    
        
    function init() {
        
    
        $scope.list = UserGroupsService.list();
        
        $scope.predicate='id';
        $scope.form = {};
        
        
        $scope.statsError = false;
        $scope.error = false;
        $scope.respMessage = '';
        
        if (!$scope.list.length) {
            UserGroupsService.getUserGroups(function (err) {
                if (err) {
                    $scope.error = true;
                    $scope.respMessage = err.data.message;
                    return;
                }
            });   
        }
        
        $scope.loadStatistic();
    }
    
    $scope.loadStatistic = function () {
        UserGroupsService.getUserGroupsStatistic(function (err, result) {
            if (err) {
                $scope.statsError = true;
                //$scope.statsRespMessage = err.data.message;
                return;
            }

            $scope.data = result.data;
            $scope.total = result.total;
            $scope.labels = result.labels;
        });
        
    };
    
    $scope.startNewUsergroup = function () {
        $scope.modalError = false;
        $scope.modalSuccess= false;
        $scope.action = $scope.storeNewUserGroup;
        $scope.form = {};
        $('#usergroupModal').modal('show'); 
    };
    
    $scope.startEditUserGroup = function (usergroup) {
        $scope.modalError = false;
        $scope.modalSuccess= false;
        $scope.action = $scope.saveEditedUserGroup;
        $scope.form.name = usergroup.name;
        $scope.form.shortForm = usergroup.shortForm;
        $scope.form.id = usergroup.id;
        $('#usergroupModal').modal('show');   
    };
    
    $scope.saveEditedUserGroup = function (usergroup) {
        UserGroupsService.editUserGroup(usergroup, function (err, result) {
            if (err) {
                $scope.modalError = true;
                $scope.respMessage = err.data.code + ': ' + err.data.message;
                return;
            }
            $scope.modalError = false;
            $scope.modalSuccess= true;
            $scope.respMessage = result.message;
            $scope.loadStatistic();
        });
    };
    
    $scope.storeNewUserGroup = function (usergroup) {
        UserGroupsService.addNewUserGroup(usergroup, function (err, result) {
            if (err) {
                $scope.modalError = true;
                $scope.respMessage = err.data.code + ': ' +  err.data.message;
                return;
            }
            $scope.modalError = false;
            $scope.modalSuccess= true;
            $scope.respMessage = result.message;
            $scope.loadStatistic();
        });
    };
    
    init();
       
}]);

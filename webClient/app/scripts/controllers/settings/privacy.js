'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('PrivacyCtrl', ['$scope', '$timeout', '$interval', 'UserService', function ($scope, $timeout, $interval, UserService) {
        
        
        var stop; 
        
        var timeStamp = [
            {name: 'Choose a precision ', format: function () {return '';}, value: ''},
            {name: 'Date + time: ', format: function () {return moment().format('YYYY-MM-DD HH:mm:ss');}, value: 'full'},
            {name: 'Date: ', format: function () {return moment().format('YYYY-MM-DD 00:00:00');}, value: 'daily'},
            {name: 'Month: ', format: function () {return moment().startOf('month').format('YYYY-MM-DD 00:00:00');}, value: 'monthly'}
        ];
        
        function init () {
            
            $scope.format = 'YYYY-MM-DD HH:mm:ss';
            $scope.showNameInRanking = Boolean($scope.user.showNameInRanking);
            $scope.options = [];
            var i;
            for (i = 0; i < timeStamp.length; i++) {
                $scope.options.push({label: timeStamp[i].name + timeStamp[i].format(), value: timeStamp[i].value});   
            }
            
            $scope.selectedPrecision = $scope.options[0];
            for(i = 0; i < $scope.options.length; i++) {
                if ($scope.options[i].value === $scope.user.timeStampPrivatelySetting) {
                    $scope.selectedTimestamp = timeStamp[i];
                    break;
                }
            }
        }
        
        $scope.changeTimestampPrecision = function () {
            var selectedLabel = $scope.selectedPrecision.label;
            if (JSON.stringify(selectedLabel) === JSON.stringify($scope.options[0].label)) {
                return;
            }
            
            if (JSON.stringify($scope.selectedTimestamp) === JSON.stringify(selectedLabel)) {
                return;   
            }
            
            UserService.setTimestampSetting($scope.selectedPrecision.value, function (err, result) {
                if (err) {
                    $scope.timestampError = true;
                    $scope.respMessage = 'Oops-a-daisy! There went something wrong :(';
                    return;
                }
                for(var i = 0; i < $scope.options.length; i++) {
                    if ($scope.options[i].value === $scope.selectedPrecision.value) {
                        $scope.selectedTimestamp = timeStamp[i];
                        break;
                    }
                }
                $scope.selectedPrecision = $scope.options[0];
                $scope.timestampSuccess = true;
                $scope.respMessageTimestamp = result.message;
                $timeout(function () {
                    $scope.timestampSuccess = false;
                }, 2000);
            });
        };
        
        $scope.$watch('showNameInRanking', function (newDecide, oldDecide) {
            if (typeof newDecide === 'undefined' || typeof oldDecide === 'undefined') {
                return;   
            }
            if (newDecide === oldDecide) {
                return;
            }
            UserService.setShowNameInRanking(newDecide, function (err, result) {
                if (err) {
                    $scope.rankingError = true;
                    $scope.respMessage = 'Oops-a-daisy! There went something wrong :(';
                    return;
                }
                $scope.rankingSuccess = true;
                $scope.respMessageRanking = result.message;
                $timeout(function () {
                    $scope.rankingSuccess = false;
                }, 2000);
                
            });
        });
        
        $scope.$on('$destroy', function() {
            $interval.cancel(stop);
            stop = undefined;
        });
        
        init();    
}]);
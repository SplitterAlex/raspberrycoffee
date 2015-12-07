'use strict';

angular.module('clientApp').directive('coffeeConsumptionChartPie', function () {
    return {
        restrict: 'E',
        template:
            '<div class="col-md-6">' +
                '<h3 class="text-center"><u>Coffee consumption</u></h3>' +
                '<br>' +
                '<div class="alert alert-danger text-center" role="alert" ng-show="error">' +
                    '<strong>Oops a daisy! There went something wrong :( </strong>' +
                '</div>' +
                '<div class="text-center spinner" ng-hide="!loading">' +
                    '<i class="fa fa-spinner fa-spin fa-5x"></i>' +
                '</div>' +
                '<div ng-hide="error|| loading" class="hide-fade">' +
                    '<canvas class="chart chart-pie" data="data" labels="labels" legend="true"></canvas>' +
                    '<h4 class="text-center">Total: {{total}}</h4>' +
                '</div>' +
                '<br>' +
                '<div class="row">' +
                    '<div class="col-lg-8 col-lg-offset-2">' +
                        '<div class="input-group">' +
                            '<div class="input-group-addon"><i class="fa fa-calendar"></i></div>' +
                            '<input date-range-picker ' +
                                'class="form-control date-picker" ' +
                                'ng-class="{disabled: loading}"' +
                                'type="text" ' +
                                'ng-model="dateRange" ' +
                                'options="dateRangeOptions" /> ' +
                        '</div> ' +
                    '</div> ' +
                '</div> ' +
                '<br> ' +
                '<br> ' +
            '</div> '
    };
});
                                                  
angular.module('clientApp').directive('monthlyStatisticBar', function () {
    return {
        restrict: 'E',
        template:
            '<div class="col-md-6">' +
                '<h3 class="text-center"><u>Monthly statistics</u></h3>' +
                '<br>' +
                '<div class="alert alert-danger text-center" role="alert" ng-show="error">' +
                    '<strong>Oops a daisy! There went something wrong :( </strong>' +
                '</div>' +
                '<div class="text-center spinner" ng-hide="!loading">' +
                    '<i class="fa fa-spinner fa-spin fa-5x"></i>' +
                '</div>' +
                '<div ng-hide="error || loading" class="hide-fade">' +
                    '<canvas class="chart chart-bar" data="data" labels="labels" series="series"></canvas>' +
                '</div>' +
                '<br>' +
                '<br>' +
                '<ul class="nav nav-pills center-pills">' +
                    '<li ng-class="{disabled: loading}" class="active dropdown">' +
                        '<a class="dropdown-toggle" id="mainYear" role="button" data-toggle="dropdown" href="">Year: {{selectedMainYear}} <span class="caret"></span></a>' +
                        '<ul class="dropdown-menu" role="menu">' +
                            '<datetimepicker data-ng-model="mainYear" ' +
                                'data-datetimepicker-config="{ dropdownSelector: \'#mainYear\', startView: \'year\', minView: \'year\' }" ' + 
                                'data-on-set-time="setMainYear(newDate, oldDate)" />' +
                        '</ul>' +
                    '</li>' +
                    '<li ng-class="{disabled: loading}" class="active dropdown">' +
                        '<a class="dropdown-toggle" id="secondYear" role="button" data-toggle="dropdown" href="">compare with year: {{selectedSecondYear}} <span class="caret"></span></a>' +
                        '<ul class="dropdown-menu" role="menu">' +
                            '<datetimepicker data-ng-model="secondYear" ' +
                                'data-datetimepicker-config="{ dropdownSelector: \'#secondYear\', startView: \'year\', minView: \'year\' }"' +
                                'data-on-set-time="setSecondYear(newDate, oldDate)" />' +
                        '</ul>' +
                    '</li>' +
                '</ul>' +
                '<p ng-show="sameValues" class="text-center text-warning">You can not compare two identical years.</p>' +
            '</div>'
    };
});               

angular.module('clientApp').directive('weeklyStatisticLine', function () {
    return {
        restrict: 'E',
        template:
            '<div class="col-md-6">' +
                '<h3 class="text-center">' +
                    '<u>Last 6 days statistic</u>' +
                '</h3>' +
                '<div class="alert alert-danger text-center" role="alert" ng-show="error">' +
                    '<strong>Oops a daisy! There went something wrong :( </strong>' +
                '</div>' +
                '<div class="text-center spinner" ng-hide="!loading">' +
                    '<i class="fa fa-spinner fa-spin fa-5x"></i>' +
                '</div>' +
                '<div ng-hide="error || loading" class="hide-fade">' +
                    '<canvas class="chart chart-line" data="data" labels="labels" legend="true" series="series"></canvas>' +
                    '<h5 class="text-center">* all coffee types, ** filtered by {{item}}</h5>' +
                    '<h6 class="text-center">' +
                        '<a href="" ng-click="changeWeekView()"> <i class="fa fa-angle-double-right"></i>change coffee type<i class="fa fa-angle-double-left"></i></a>' +
                    '</h6>' +
                '</div>' +
            '</div>'
    };
}); 

angular.module('clientApp').directive('customRangeStatisticLine', function () {
    return {
        restrict: 'E',
        template:
            '<div class="col-md-6">' +
                '<h3 class="text-center">' +
                    '<u>30 days statistic</u>' +
                '</h3>' +
                '<br>' +
                '<div class="alert alert-danger text-center" role="alert" ng-show="error">' +
                    '<strong>Oops a daisy! There went something wrong :( </strong>' +
                '</div>' +
                '<div class="text-center spinner" ng-hide="!loading">' +
                    '<i class="fa fa-spinner fa-spin fa-5x"></i>' +
                '</div>' +
                '<div ng-hide="error || loading" class="hide-fade">' +
                    '<canvas class="chart chart-line" data="data" labels="labels" legend="true" series="series"></canvas>' +
                    '<h5 class="text-center">** filtered by {{item}}</h5>' +
                    '<h6 class="text-center">' +
                        '<a href="" ng-click="changeView()"> <i class="fa fa-angle-double-right"></i>change coffee type<i class="fa fa-angle-double-left"></i></a>' +
                    '</h6>' +
                '</div>' +
                '<div class="row">' +
                    '<div class="col-lg-8 col-lg-offset-2">' +
                        '<div class="input-group">' +
                            '<div class="input-group-addon"><i class="fa fa-calendar"></i></div>' +
                            '<input date-range-picker ' +
                                'class="form-control date-picker" ' +
                                'ng-class="{disabled: loading}"' +
                                'type="text" ' +
                                'ng-model="selectedRange" ' +
                                'options="dateRangeOptions" /> ' +
                        '</div> ' +
                    '</div> ' +
                '</div> ' +
            '</div>'
    };
}); 

angular.module('clientApp').directive('dailyStatisticLine', function () {
    return {
        restrict: 'E',
        template:
            '<div class="col-md-6">' +
                '<h3 class="text-center"><u>Daily statistics</u></h3>' +
                '<br>' +
                '<div class="alert alert-danger text-center" role="alert" ng-show="error">' +
                    '<strong>Oops a daisy! There went something wrong :( </strong>' +
                '</div>' +
                '<div class="text-center spinner" ng-hide="!loading">' +
                    '<i class="fa fa-spinner fa-spin fa-5x"></i>' +
                '</div>' +
                '<div ng-hide="error || loading" class="hide-fade">' +
                    '<canvas class="chart chart-line" data="data" labels="labels" legend="true" series="series"></canvas>' +
                '</div>' +
                '<br>' +
                '<ul class="nav nav-pills center-pills">' +
                    '<li ng-class="{disabled: loading}" class="active dropdown">' +
                        '<a class="dropdown-toggle" id="mainDay" role="button" data-toggle="dropdown" href="">Day: {{selectedMainDay}} <span class="caret"></span></a>' +
                        '<ul class="dropdown-menu" role="menu">' +
                            '<datetimepicker data-ng-model="mainDay" ' +
                                'data-datetimepicker-config="{ dropdownSelector: \'#mainDay\', startView: \'year\', minView: \'day\' }" ' + 
                                'data-on-set-time="setMainDay(newDate, oldDate)" />' +
                        '</ul>' +
                    '</li>' +
                    '<li ng-class="{disabled: loading}" class="active dropdown">' +
                        '<a class="dropdown-toggle" id="secondDay" role="button" data-toggle="dropdown" href="">compare with day: {{selectedSecondDay}} <span class="caret"></span></a>' +
                        '<ul class="dropdown-menu" role="menu">' +
                            '<datetimepicker data-ng-model="secondDay" ' +
                                'data-datetimepicker-config="{ dropdownSelector: \'#secondDay\', startView: \'year\', minView: \'day\' }"' +
                                'data-on-set-time="setSecondDay(newDate, oldDate)" />' +
                        '</ul>' +
                    '</li>' +
                '</ul>' +
                '<p ng-show="sameValues" class="text-center text-warning">You can not compare two identical days.</p>' +
            '</div>'
    };
});

angular.module('clientApp').directive('rankingDateChoosingPills', function () {
    return {
        restrict: 'E',
        scope: false,
        template:
            '<ul class="nav nav-pills center-pills">' +
                '<li ng-class="{active: selectedPill==1, disabled: loading}">' +
                    '<a class="dropdown-toggle" role="button" ng-click="rankingAllTime()" data-toggle="dropdown" href="">All time</a>' +
                '</li>' +
                '<li ng-class="{active: selectedPill==2, disabled: loading}" class="dropdown">' +
                    '<a class="dropdown-toggle" id="dateRankingDropdownMonth" role="button" data-toggle="dropdown" href="">Month: {{rankingSelectedMonth}} <span class="caret"></span></a>' +
                    '<ul class="dropdown-menu" role="menu">' +
                        '<datetimepicker data-ng-model="rankingMonth" ' +
                            'data-datetimepicker-config="{ dropdownSelector: \'#dateRankingDropdownMonth\', startView: \'month\', minView: \'month\' }" ' + 
                            'data-on-set-time="rankingMonthSet(newDate, oldDate)" />' +
                    '</ul>' +
                '</li>' +
                '<li ng-class="{active: selectedPill==3, disabled: loading}" class="dropdown">' +
                    '<a class="dropdown-toggle" id="dateRankingDropdownYear" role="button" data-toggle="dropdown" href="">Year: {{rankingSelectedYear}} <span class="caret"></span></a>' +
                    '<ul class="dropdown-menu" role="menu">' +
                        '<datetimepicker data-ng-model="rankingYear" ' +
                            'data-datetimepicker-config="{ dropdownSelector: \'#dateRankingDropdownYear\', startView: \'year\', minView: \'year\' }"' +
                            'data-on-set-time="rankingYearSet(newDate, oldDate)" />' +
                    '</ul>' +
                '</li>' +
            '</ul>'
    };
});

angular.module('clientApp').directive('ranking', function () {
    return {
        restrict: 'E',
        scope: true,
        link: function (scope, elem, attrs) {
            if (attrs.purpose === 'user') {
                scope.rankingList = scope.$parent.rankingUsers;
            } else {
                scope.rankingList = scope.$parent.rankingGroups;
            }
        },
        template:
            '<div class="alert alert-danger text-center" role="alert" ng-show="error">' +
                '<strong>Oops a daisy! There went something wrong :( </strong>' +
            '</div>' +
            '<div class="text-center spinner" ng-hide="!loading">' +
                '<i class="fa fa-spinner fa-spin fa-5x"></i>' +
            '</div>' +
            '<div ng-hide="error || loading" class="hide-fade">' +
                '<div class="table-responsive">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>#</th>' +
                                '<th>Name</th>' +
                                '<th>Total</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' +
                            '<tr ng-repeat="entry in rankingList">' +
                                '<td>' +
                                    '<div style="color:#B8860B" ng-if="$index == 0">' +
                                        '<i class="fa fa-trophy"></i>' +
                                    '</div>' +
                                    '<div style="color:#C0C0C0" ng-if="$index == 1">' +
                                        '<i class="fa fa-trophy"></i>' +
                                    '</div>' +
                                    '<div style="color:#CD7F32" ng-if="$index == 2">' +
                                        '<i class="fa fa-trophy"></i>' +
                                    '</div>' +
                                    '<div ng-if="$index > 2">' +
                                        '{{$index + 1}}' +
                                    '</div>' +
                                '</td>' +
                                '<td>{{entry.name}}</td>' +
                                '<td>{{entry.total}}</td>' +
                            '</tr>' +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="alert alert-warning text-center" role="alert" ng-show="!rankingList.length">' +
                    '<strong>No fellow campaigners found!</strong>' +
                '</div>' +
            '</div>'
    };
});


'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module of the application.
 */
angular
  .module('clientApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'route-segment',
    'view-segment',
    'frapontillo.bootstrap-switch',
    'chart.js',
    'ui.bootstrap.datetimepicker',
    'daterangepicker'
  ]);

angular.module('clientApp').config(['$provide', '$routeProvider', '$routeSegmentProvider', '$httpProvider', function ($provide, $routeProvider, $routeSegmentProvider, $httpProvider) {
    
    $httpProvider.interceptors.push('tokenInterceptor');
    
    $routeSegmentProvider
        .when('/', 'signin')
        .when('/signin', 'signin')
        .when('/controlPanel', 'cp')
        .when('/controlPanel/dashboard', 'cp.dashboard')
        .when('/controlPanel/charts/global', 'cp.charts.global')
        .when('/controlPanel/charts/group', 'cp.charts.group')
        .when('/controlPanel/charts/user', 'cp.charts.user')
        .when('/controlPanel/yourTransactions', 'cp.yourTransactions')
        .when('/controlPanel/settings', 'cp.settings')
        .when('/controlPanel/admin/users', 'cp.admin.users')
        .when('/controlPanel/admin/transactions', 'cp.admin.transactions')
        .when('/controlPanel/admin/usergroups', 'cp.admin.usergroups')
        .when('/controlPanel/admin/products', 'cp.admin.products')
    
        .segment('signin', {
            templateUrl: 'views/signin.html',
            controller: 'SigninCtrl',
        })
    
        .segment('cp', {
            templateUrl: 'views/controlPanel/controlPanel.html',
            controller: 'ControlPanelCtrl',
            resolve: {
                factory: [ 'CheckToken', function (CheckToken) {
                    return CheckToken.checkTokenAndInitUserService();   
                }
            ]}
        })
    
        .within()
            
            .segment('dashboard', {
                default: true,
                controller: 'DashboardCtrl',
                templateUrl: 'views/controlPanel/dashboard/dashboard.html'
            })
    
            .segment('charts', {
                templateUrl: 'views/controlPanel/charts/charts.html',
            })
    
            .within()
    
                .segment('global', {
                    default: true,
                    templateUrl: 'views/controlPanel/charts/global.html',
                })
    
                .segment('group', {
                    templateUrl: 'views/controlPanel/charts/group.html',
                })
    
                .segment('user', {
                    templateUrl: 'views/controlPanel/charts/user.html',
                })
    
                .up()
    
            .segment('yourTransactions', {
                controller: 'YourTransactionsCtrl',
                templateUrl: 'views/controlPanel/yourTransactions/yourTransactions.html'
            })
    
            .segment('settings', {
                templateUrl: 'views/controlPanel/settings/settings.html'
            })
    
            .segment('admin', {
                templateUrl: 'views/controlPanel/admin/admin.html'
            })
    
            .within()
    
                .segment('users', {
                    default: true,
                    controller: 'UsersListCtrl',
                    templateUrl: 'views/controlPanel/admin/users/users.html',
                })
    
                .segment('transactions', {
                    controller: 'TransactionsCtrl',
                    templateUrl: 'views/controlPanel/admin/transactions/transactions.html',
                })
    
                .segment('usergroups', {
                    templateUrl: 'views/controlPanel/admin/usergroups/usergroups.html',
                    controller: 'UsergroupsCtrl'
                })
    
                .segment('products', {
                    templateUrl: 'views/controlPanel/admin/products/products.html',
                    controller: 'ProductsCtrl'
                });
    
    $routeProvider.otherwise({redirectTo: '/'});
        
    //$resourceProvider.defaults.stripTrailingSlashes = false;
    
  }]).run (['$rootScope', '$location', '$window', function ($rootScope, $location, $window) {
    //redirect to /controlPanel when a token was found
    $rootScope.$on('$routeChangeStart', function(event, next) {
        if (!$window.localStorage.token) {
            if (next.segment !== 'signin') {
                //redirect to original path after successfully signin
                $rootScope.pathToForward = next.originalPath;
                //console.log($rootScope.pathToForward);
                $location.path('/');   
            }
        } else {
            if (next.segment === 'signin') {
                $location.path('/controlPanel/dashboard');   
            }
        }
    });
}]);




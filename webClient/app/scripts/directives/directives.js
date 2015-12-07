'use strict';

angular.module('clientApp').directive('checkUsername', ['$q', '$http', function ($q, $http) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, elem, attrs, ngModel) {
            
            var div = $('#check-username-div');
            var icon = $('#check-username-icon');

            scope.$watch(attrs.ngModel, function() {
                if (!ngModel.$dirty) {
                    return;
                }
                if (ngModel.$error.uniqueUsername) {
                    return;
                }
                div.removeClass();
                icon.removeClass();
                if(ngModel.$valid) {
                    div.addClass('has-success');
                    icon.addClass('fa fa-check');
                } else {
                    div.addClass('has-warning');
                    icon.addClass('fa fa-exclamation-triangle');
                }
            });
                
            ngModel.$asyncValidators.uniqueUsername = function (modelValue, viewValue) {
                icon.removeClass();
                icon.addClass('fa fa-spinner fa-spin');
                div.removeClass();
                var userInput = modelValue || viewValue;
                return $http.get('api/signUp/checkUsername/' + userInput).
                    success(function () {
                        return true;
                    }).error(function () {
                        icon.removeClass();
                        div.addClass('has-error');
                        icon.addClass('fa fa-exclamation-triangle');
                        return $q.reject('exists');
                    });
            };
            
            scope.$watch('clearForm', function () {
                div.removeClass();
                icon.removeClass();
            });
        }
    };
}]);

angular.module('clientApp').directive('colorFeedback', function () {
    return {
        restrict: 'A',
        link: function (scope, elem) {
            
            var childElem = elem[0].querySelectorAll('[ng-model]');
            var childCtrl = angular.element(childElem).controller('ngModel');
            var childModelValue = childElem[0].attributes.getNamedItem('ng-model').nodeValue;
            
            scope.$watch(childModelValue, function() {
                if (!childCtrl.$dirty) {
                    return;    
                }
                elem.removeClass('has-warning');
                elem.removeClass('has-success');
                if(childCtrl.$valid) {
                    elem.addClass('has-success');
                } else {
                    elem.addClass('has-warning');
                }
            });
            
            scope.$watch('clearForm', function () {
                elem.removeClass('has-success');
                elem.removeClass('has-warning');
            });
        }
    };
});

angular.module('clientApp').directive('beautifyDate', function () {
    return {
        restrict: 'A',
        link: function (scope) {
            scope.beautifiedDate = moment(scope.transaction.tDate.slice(0,19).replace('T', ' ')).format('MMM Do YYYY, HH:mm:ss');
        }
    };
});



angular.module('clientApp').directive('equals', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            if(!ngModel) {
                return;// do nothing if no ng-model
            }

            // watch own value and re-validate on change
            scope.$watch(attrs.ngModel, function() {
                validate();
            });
            var div = $('.confirm');
            scope.$watch('signupForm.$error.equals', function () {
                if (!ngModel.$dirty) {
                    return;   
                }
                if (ngModel.$valid) {
                    div.addClass('has-success');
                    div.removeClass('has-warning');
                } else {
                    div.addClass('has-warning');
                    div.removeClass('has-success');
                }    
            });

            // observe the other value and re-validate on change
            attrs.$observe('equals', function () {
                //console.log('equals');
                validate();
            });

            var validate = function() {
                // values
                var val1 = ngModel.$viewValue;
                var val2 = attrs.equals;
        
                if (typeof val1 === 'undefined' || typeof val2 === 'undefined') {
                    return ngModel.$setValidity('equals', false);
                }
                // set validity
                ngModel.$setValidity('equals', val1 === val2);
            };
        }
    };
});

angular.module('clientApp').directive('choose', function() {
    return {
        
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            if(!ngModel) {
                return;
            }// do nothing if no ng-model
            
            ngModel.$setValidity('choose', false);
      
            attrs.$observe('choose', function () {
                if (parseInt(attrs.choose) === 0) {
                    ngModel.$setValidity('choose', false);   
                } else {
                    ngModel.$setValidity('choose', true);   
                }
            });
        }
    };
});

angular.module('clientApp').directive('loadCorrectSidebar', [ function () {
    
    return {
        restrict: 'C',
        link: function (scope, elem) {
            $(window).bind('load resize', function() {
                var topOffset = 50;
                var width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
                if (width < 768) {
                    elem.addClass('collapse');
                    topOffset = 100; // 2-row-menu
                } else {
                    elem.removeClass('collapse');
                }

                var height = ((this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height) - 1;
                height = height - topOffset;
                if (height < 1) {
                    height = 1;
                }
                if (height > topOffset) {
                    $('#page-wrapper').css('min-height', (height) + 'px');
                }
            });

            var url = window.location;
            var element = $('ul.nav a').filter(function() {
                return this.href === url || url.href.indexOf(this.href) === 0;
            }).addClass('active').parent().parent().addClass('in').parent();
            if (element.is('li')) {
                element.addClass('active');
            } 
        }
    };
}]);

angular.module('clientApp').directive('backToTop', function () {
    
    return {
        restrict: 'C',
        link: function (scope, elem) {
            var offset = 300,
                offsetOpacity = 1200,
                scrollTopDuration = 700;
            
            $(window).scroll(function () {
                if ($(this).scrollTop() > offset) {
                    elem.addClass('cd-is-visible');
                } else {
                    elem.removeClass('cd-is-visible cd-fade-out');
                }
                //( $(this).scrollTop() > offset ) ? elem.addClass('cd-is-visible') : elem.removeClass('cd-is-visible cd-fade-out');
                if( $(this).scrollTop() > offsetOpacity ) { 
	               elem.addClass('cd-fade-out');
                } 
            });
            
            //smooth scroll to top
	        elem.on('click', function(event){
                event.preventDefault();
                $('body,html').animate({
                    scrollTop: 0 ,
                }, scrollTopDuration );
            });
        }
    };
});


angular.module('clientApp').directive('currentDepositPanel', [ function () {
    return {
        restrict: 'C',
        link: function (scope, elem) {
            scope.$watch('user.currentDeposit', function () {
                elem.removeClass('panel-green');
                elem.removeClass('panel-yellow');
                elem.removeClass('panel-red');
                if (scope.user.currentDeposit < 0) {
                    elem.addClass('panel-red');
                } else if (scope.user.currentDeposit <= scope.user.emailCreditLimitForNotification) {
                    elem.addClass('panel-yellow');   
                } else {
                    elem.addClass('panel-green');
                }
            });
        }
    };
}]);

angular.module('clientApp').directive('initModal', ['UserGroupsService', function (UserGroupsService) {
    
    return {
        restrict: 'A',
        link: function (scope, elem) {
            

            elem.on('show.bs.modal', function () {
                scope.options = UserGroupsService.getSelectList();
                if (scope.options.length === 1) {
                    UserGroupsService.getUserGroups(function (err) {
                        if (err) {
                            scope.options = [{label: 'Can\'t load groups - Server error', value: 999}];
                            scope.selectedGroup = scope.options[0];
                            return;
                        }
                        scope.options = UserGroupsService.getSelectList();
                        scope.selectedGroup = scope.options[0];
                    });
                }
                scope.selectedGroup = scope.options[0];
            });
        }
    };                       
}]);

angular.module('clientApp').directive('calculateSum', function () {
    var sum;
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            if (scope.$index === 0) {
                sum = 0;
            }
            sum = +sum +parseFloat(Math.round(attrs.calculateSum * 100) / 100);
            scope.$parent.sum = sum.toFixed(2);
        }
    };
});

angular.module('clientApp').directive('manipulateUserslistEntrys', function () {
    return {
        link: function(scope) {
            if (scope.user.groupShortForm === null) {
                if (scope.user.groupName === null) {
                    scope.user.groupShortForm = 'k/a';   
                } else {
                    scope.user.groupShortForm = scope.user.groupName;
                }
            }
            
            scope.user.currentDeposit = parseFloat(Math.round(scope.user.currentDeposit * 100) / 100).toFixed(2);
            scope.user.debtLimit =  parseFloat(Math.round(scope.user.debtLimit * 100) / 100).toFixed(2);
        }
    };
});

angular.module('clientApp').directive('currentTime', ['$interval', function($interval) {
            return function(scope, element) {
                var stopTime; // so that we can cancel the time updates

                function updateTime() {
                    //console.log(format);
                    element.text(scope.selectedTimestamp.name + scope.selectedTimestamp.format());
                }
                stopTime = $interval(updateTime, 1000);

                element.on('$destroy', function() {
                    $interval.cancel(stopTime);
                });
            };
        }
]);

angular.module('clientApp').directive('tableColorFeedback', function () {
    return {
        restrict: 'A',
        link: function(scope, elem) {
            scope.transaction.amount = parseFloat(Math.round(scope.transaction.amount * 100) / 100).toFixed(2);
            if (scope.transaction.amount < 0) {
                elem.addClass('danger');
            } else if (scope.transaction.amount > 0) {
                scope.transaction.amount = '+' + scope.transaction.amount;
                elem.addClass('success');   
            }
        }
    };
});

angular.module('clientApp').directive('beautifyPrice', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            
            attrs.$observe('beautifyPrice', function () {
                if (scope.product.price === null || scope.product.price === '') {
                    scope.product.price = '';
                    scope.euro = '';
                } else {
                    var p = scope.product.price;
                    if (typeof p === 'number') {
                        scope.product.price = parseFloat(Math.round(p * 100) / 100).toFixed(2);
                    } else {
                        scope.product.price = parseFloat(Math.round((parseFloat(p.replace(',', '.'))) * 100) / 100).toFixed(2);
                    }
                    scope.euro = '€';
                }
            });
        }
    };
});

angular.module('clientApp').directive('insertDefaultAmount', ['TransactionPurposeService', function (TransactionPurposeService) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, elem, attrs, ngModel) {
            
            if ((TransactionPurposeService.list()).length === 0) {
                TransactionPurposeService.getTransactionPurposes(function (err) {
                    if (err) {
                        console.log(err);   
                    }
                });   
            }
            
            attrs.$observe('insertDefaultAmount', function () {
                if (!scope.newTransactionForm.purpose.$dirty) {
                    return;   
                }
                var purpose = (TransactionPurposeService.getTransactionPurposeById(parseInt(attrs.insertDefaultAmount)));
                if ((purpose.price) === null || (purpose.price) === '') {
                    scope.newTransaction.amount = '';
                    scope.disableAmount = false;
                } else {
                    scope.newTransaction.amount = parseFloat((Math.abs(purpose.price) * -1)*100/100).toFixed(2);
                    scope.disableAmount = true;
                }
                
                var amount = parseFloat(scope.newTransaction.amount);
                
                elem.removeClass('positiv-amount');
                elem.removeClass('negativ-amount');
                if (amount < 0) {
                    elem.addClass('negativ-amount');   
                } else if (amount > 0) {
                    elem.addClass('positiv-amount'); 
                } 
            });

            scope.$watch(attrs.ngModel, function () {
                if (scope.disableAmount) {
                    ngModel.$setValidity('correct', true);
                    return;  
                }
                
                elem.removeClass('negativ-amount');
                elem.removeClass('positiv-amount');
                var amount = parseFloat(ngModel.$viewValue);
                if (amount === 0) {
                    return;
                }
                
                //98 = Credit
                if (parseInt(attrs.insertDefaultAmount) === 9) {
                    if (amount < 0) {
                        ngModel.$setValidity('correct', false);
                        return;
                    }
                    elem.addClass('positiv-amount');
                }
                
                //99 = Debit
                if (parseInt(attrs.insertDefaultAmount) === 10) {
                    if (amount > 0) {
                        ngModel.$setValidity('correct', false);
                        return;
                    }
                    elem.addClass('negativ-amount');
                }
                ngModel.$setValidity('correct', true);
                
            });
        }
    };
}]);


angular.module('clientApp').directive('placeDefaultText', ['DefaultNotesService', function (DefaultNotesService) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            
            if ((DefaultNotesService.list()).length === 0) {
                DefaultNotesService.fetchDefaultNotesFromServer(function (err) {
                    if (err) {
                        console.log(err);   
                    }
                });   
            }
            
            attrs.$observe('placeDefaultText', function () {
                if (!scope.newTransactionForm.purpose.$dirty) {
                    return;   
                }
                scope.newTransaction.note = DefaultNotesService.getDefaultNoteById(parseInt(attrs.placeDefaultText));
                
            });
        }
    };
}]);
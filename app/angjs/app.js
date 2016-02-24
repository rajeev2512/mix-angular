'use strict';

var mixApp = angular.module('mixApp', [
	'ngRoute', 
	'homeControllers'
	]);


mixApp.config(['$routeProvider', function($routeProvider) {

    $routeProvider.
      when('/', {
        templateUrl:'partials/recently_listed.html',
        controller: 'justListed'
      }).
      when('/property/:slug', {
        templateUrl: 'partials/prop_details.html',
        controller: 'propertyDetails'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);

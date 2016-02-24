'use strict';

var homeControllers = angular.module('homeControllers', []);

homeControllers.controller('justListed', ['$scope', '$http', function($scope, $http) {

	$http.get('property_data/properties.json')
		.success(function (data){
			$scope.properties = data;	
		})
		.error(function(){
			console.log('error');
		});

}]);

homeControllers.controller('propertyDetails', ['$scope', '$http', '$routeParams', 
	function($scope, $http, $routeParams){
	
		$http.get('property_data/'+ $routeParams.slug +'.json')
			.success(function(data){
				$scope.property = data;
			})
}])
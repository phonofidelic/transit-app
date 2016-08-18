'use-strict';
angular.module('transitApp').factory('LocationService', ['$http', function($http){
	function LocationService() {};
	LocationService.prototype.getCurrentPosition = function(resolve,reject, options) {
		return new Promise(function(resolve, reject) {
			navigator.geolocation.getCurrentPosition(resolve, reject, options);
		});
	};
	return LocationService;
}])
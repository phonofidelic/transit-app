'use-strict';
angular.module('transitApp').factory('LocationService', ['$http', function($http){
	function LocationService() {};
	var geocoder = new google.maps.Geocoder;
	LocationService.prototype.getCurrentPosition = function(resolve, reject, options) {
		return new Promise(function(resolve, reject) {
			navigator.geolocation.getCurrentPosition(resolve, reject, options);
		});
	};
	LocationService.prototype.revGeocode = function(position) {
		var latlng = {};
		latlng.lat = position.latitude;
		latlng.lng = position.longitude;
		return new Promise(function(resolve, reject) {
			geocoder.geocode({'location': latlng}, function(results, status) {
				if (status === 'OK') {
					resolve(results[0].formatted_address);
				} else {
					reject(console.log('geocoding error: ', status))
				}
			});
		});
	};
	return LocationService;
}]);
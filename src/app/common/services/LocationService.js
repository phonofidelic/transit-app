'use-strict';
angular.module('transitApp').factory('LocationService', ['$http', function($http){
	function LocationService() {};
	var geocoder = new google.maps.Geocoder;
	LocationService.prototype.getCurrentPosition = function(resolve, reject, options) {
		return new Promise(function(resolve, reject) {
			navigator.geolocation.getCurrentPosition(resolve, reject, options);
		});
	};
	LocationService.prototype.getStaticPosition = function() {
		return $http.get('assets/mockData/staticCoordsVancouver.json').then(function(position) {
			console.log('position##', position)
			return position.data;
		}); 
	};
	LocationService.prototype.revGeocode = function(position) {
		var latlng = {};
		latlng.lat = position.latitude;
		latlng.lng = position.longitude;
		return new Promise(function(resolve, reject) {
			geocoder.geocode({'location': latlng}, function(results, status) {
				if (status === 'OK') {
					resolve(results[0]);
				} else {
					reject(console.log('geocoding error: ', status))
				}
			});
		});
	};
	return LocationService;
}]);
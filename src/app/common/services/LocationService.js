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

	LocationService.prototype.geocode = function(address) {
		return new Promise(function(resolve, reject) {
			var key = 'AIzaSyAJa-YCzQ7t6AhlXCj7c-9p1b0QdlWZWG8';
			return $http({
				method: 'GET',
				url: 'https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&key='+key
			}).then(function(response) {
				console.log('LocationService.geocode response', response);
				resolve(response);
			}).catch(function(err) {
				$log.error('LocationService.geocode error:', err);
			});
		})
		
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

	LocationService.prototype.decodePolyline = function(str, precision) {
		return new Promise(function(resolve, reject) {

		    var index = 0,
		        lat = 0,
		        lng = 0,
		        coordinates = [],
		        shift = 0,
		        result = 0,
		        byte = null,
		        latitude_change,
		        longitude_change,
		        factor = Math.pow(10, precision || 6);

		    // Coordinates have variable length when encoded, so just keep
		    // track of whether we've hit the end of the string. In each
		    // loop iteration, a single coordinate is decoded.
		    while (index < str.length) {

		        // Reset shift, result, and byte
		        byte = null;
		        shift = 0;
		        result = 0;

		        do {
		            byte = str.charCodeAt(index++) - 63;
		            result |= (byte & 0x1f) << shift;
		            shift += 5;
		        } while (byte >= 0x20);

		        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

		        shift = result = 0;

		        do {
		            byte = str.charCodeAt(index++) - 63;
		            result |= (byte & 0x1f) << shift;
		            shift += 5;
		        } while (byte >= 0x20);

		        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

		        lat += latitude_change;
		        lng += longitude_change;

		        coordinates.push([lat / factor, lng / factor]);
		    }
		    resolve(coordinates);
		});
	};

	return LocationService;
}]);
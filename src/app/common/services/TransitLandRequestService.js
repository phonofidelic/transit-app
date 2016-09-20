angular.module('transitApp').factory('TransitLandRequestService', ['$http', function($http) {
	function TransitLandRequestService() {
		var self = this;
	};

	TransitLandRequestService.prototype.routesByOperator = function(region) {
		var requestParams = {
			region: region
		};
		var url = 'https://transit.land/api/v1/routes?operated_by='+
					   requestParams.region;

		return $http({
			method: 'GET',
			url: url,
			eventHandlers: {
				progress: function(e) {
					console.log('progress: ', e);
				}
			}
		}).then(function(response) {
			// console.log('transitland response: ', response);
			return response;
		}).catch(function(e) {
			console.log('transitland error: ', e);
		});
	};

	TransitLandRequestService.prototype.routeByOnestopId = function(onestop_id) {
		var url = 'https://transit.land/api/v1/routes?onestop_id='+onestop_id;

		return $http({
			method: 'GET',
			url: url,
			eventHandlers: {
				progress: function(e) {
					console.log('progress: ', e);
				}
			}
		}).then(function(response) {
			// console.log('transitland response: ', response);
			return response;
		}).catch(function(e) {
			console.log('transitland error: ', e);
		});
	};

	TransitLandRequestService.prototype.routesByBbox = function(coords) {
		return new Promise(function(resolve){
			var swLat = coords.lat + 0.05,
				swLon = coords.lon - 0.05,
				neLat = coords.lat -0.05,
				neLon = coords.lon + 0.05;
			var url = 'https://transit.land/api/v1/routes?bbox=' + swLon +','+ swLat +','+ neLon +','+ neLat;
			// var url = 'http://transit.land/api/v1/routes?operatedBy=o-dhw-browardcountytransit';

			return $http.get(url).then(function(response) {
				console.log('bbox response: ', response);
				resolve(response.data);
			});
		});
	};

	TransitLandRequestService.prototype.getStopInfo = function(onestop_id) {
		var url = 'http://transit.land/api/v1/stops?onestop_id='+onestop_id;

		return $http({
			method: 'GET',
			url: url,
		}).then(function(response) {
			console.log('getStopInfo response: ', response);
			return response;
		}).catch(function(e) {
			console.log('getStopInfo error: ', e);
		});
	};

	TransitLandRequestService.prototype.routeBetween = function(dep_onestop_id, arr_onestop_id) {
		// convert onestop_id to coords

		return $http({
			method: 'GET',
			url: 'http://transit.land/api/v1/stops?onestop_id='+dep_onestop_id
		}).then(function(response) {
			var endpoints = {origin: response.data.stops[0]};
			return endpoints;
		}).then(function(endpoints) {
			$http({
				method: 'GET',
				url: 'http://transit.land/api/v1/stops?onestop_id='+arr_onestop_id
			}).then(function(response) {
				endpoints.destination = response.data.stops[0];
				return endpoints;
			}).then(function(endpoints) {
				console.log('endpoints: ', endpoints);
				console.log('endpoints.origin: ', endpoints.origin);
				console.log('endpoints.destination: ', endpoints.destination);
				var requestParams = {
					"locations": [
						{
							"lat": endpoints.origin.geometry.coordinates[1],
							"lon": endpoints.origin.geometry.coordinates[0],
							"type": 'break'
						},
						{
							"lat": endpoints.destination.geometry.coordinates[1],
							"lon": endpoints.destination.geometry.coordinates[0],
							"type": 'break'
						}
					],
					"costing": "multimodal"
					// "costing_options": {
					// 	"transit": {
					// 		"use_bus": 1.0,
					// 		"use_rail": 1.0
					// 	}
					// }
				};

				var formatedParams = JSON.stringify(requestParams);

				var mapzenUrl = 'https://valhalla.mapzen.com/route?json='+JSON.stringify(requestParams)+'&api_key=valhalla-m9bds2x'.replace('%22', '');
				console.log('mapzenUrl: ', mapzenUrl);

				$http({
					method: 'GET',
					url: mapzenUrl,
				}).then(function(response) {
					console.log('routeBetween response: ', response);
					return response;
				}).catch(function(e) {
					console.log('routeBetween error: ', e);
				});
			});
			return endpoints;
		});
	};

	TransitLandRequestService.prototype.scheduleStopPairs = function(onestop_id) {
		return $http.get('http://transit.land/api/v1/schedule_stop_pairs?origin_onestop_id='+onestop_id)
		.then(function(response) {
			console.log('schedule_stop_pair response: ', response);
			return response.data.schedule_stop_pairs;
		}).catch(function(e) {
			console.log('schedule_stop_pair error: ', e);
		});
	};

	TransitLandRequestService.prototype.routeStopPattern = function(routeId) {
		return $http({
			method: 'GET',
			url: 'http://transit.land/api/v1/route_stop_patterns?onestop_id=' + routeId
		}).then(function(response) {
			console.log('from routeStopPattern: ')
			console.log(response);
			var stops = [];
			response.data.route_stop_patterns[0].stop_pattern.forEach(function(stop) {
				// console.log(stop)
				stops.push(stop);
			});
			return stops;
		}).catch(function(err) {
			console.log('routeStopPattern error: ', err);
		});
	};
	return TransitLandRequestService;
}]);


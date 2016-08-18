'use-strict';
angular.module('transitApp').controller('PlanTripController', ['$scope', '$http', 'RequestService', 'LocationService', function($scope, $http, RequestService, LocationService){
	var vm = this;
	var requestService = new RequestService();
	var locationService = new LocationService();

	// vm.tripData = {};

	vm.sendRequest = function(input) {
		locationService.getCurrentPosition().then(function(position) {
			console.log('getPosition result: ', position);
			return position.coords;
		}).then(function(coords) {
			var json = {
				"locations": [
					{
						"lat": coords.latitude,
						"lon": coords.longitude
						// "type": "break"
					},
					{
						"lat": 33.8128,
						"lon": -117.9259
						// "type": "break"
					}	
				],
				"costing": "auto",
				"directions_options": { "units":"miles" }
			}
		
			var url = 'https://valhalla.mapzen.com/route?json='+JSON.stringify(json)+'&api_key=valhalla-m9bds2x'.replace('%22', '');

			$http({
				method: 'GET',
				url: url,
			}).then(function(response) {
				console.log('sendRequest response: ', response);
				vm.tripData = response.data.trip;
			}).catch(function(e) {
				console.log('RequestService.send error: ', e);
			});
		}).catch(function(e) {
			console.log('sendRequest error: ', e);
		});	
	};

	vm.autoAddress = function(input) {
		// var input = angular.element('#departure-inp').val();
		locationService.getCurrentPosition().then(function(position) {
			console.log('getPosition result: ', position);
			return position.coords;
		}).then(function(coords) {
			console.log('autoAddress: ', input);

			var url = 'https://search.mapzen.com/v1/autocomplete?api_key=search-3LVgAzp&focus.point.lat='+coords.latitude+'&focus.point.lon='+coords.longitude+'&text='+input;
			console.log('url: ', url);

			$http({
				method: 'GET',
				url: url
			}).then(function(response) {
				console.log('autoAddress response: ', response)
				var suggestions = [];
				response.data.features.forEach(function(item) {
					suggestions.push({
						label: item.properties.label,
						value: item.properties
					});
					console.log('suggestions: ', suggestions);

					// return angular.element('#departure-inp').val(suggestions[0].label).change();
					vm.suggestions = suggestions;
				})
			}).catch(function(e) {
				console.log('autoAddress error: ', e);
			});
		});


	};
}]);
'use-strict';
angular.module('transitApp').controller('PlanTripController', ['$scope', '$http', 'RequestService', 'LocationService', '$timeout', function($scope, $http, RequestService, LocationService, $timeout){
	var vm = this;
	var requestService = new RequestService();
	var locationService = new LocationService();

	vm.inputData = {};
	vm.inputData.departure = {};
	vm.inputData.departure.coords = {};
	vm.inputData.arrival = {};
	vm.inputData.arrival.coords = {};
	vm.currentPosition = {};

	// vm.tripData = {};

	vm.getCurrentPosition = function() {
		locationService.getCurrentPosition().then(function(position) {
			console.log('getPosition result: ', position.coords);
			vm.currentPosition.lat = position.coords.latitude;
			vm.currentPosition.lon = position.coords.longitude;
		});
	};

	vm.autoAddress = function(id) {
		var input = document.getElementById(id);
		console.log('input: ', input.id);
		var options = {
			types: ['address']
		};
		if (input.id === 'departure-inp') {
			$scope.departureAutocomplete = new google.maps.places.Autocomplete(input, options);
		} else {
			$scope.arrivalAutocomplete = new google.maps.places.Autocomplete(input, options);
		}
	};

	vm.getAddress = function(id) {
		if (id === 'departure-inp') {
			$timeout(function() {
				console.log('*** getAddress ***');
				console.log('locationData: ', $scope.departureAutocomplete.getPlace().geometry.location);
				vm.inputData.departure.name = $scope.departureAutocomplete.getPlace().name;
				vm.inputData.departure.coords.lat = $scope.departureAutocomplete.getPlace().geometry.location.lat();
				vm.inputData.departure.coords.lon = $scope.departureAutocomplete.getPlace().geometry.location.lng();
			}, 500);
		} else {
			$timeout(function() {
				console.log('*** getAddress ***');
				console.log('locationData: ', $scope.arrivalAutocomplete.getPlace().geometry.location.lat());
				vm.inputData.arrival.name = $scope.arrivalAutocomplete.getPlace().name;
				vm.inputData.arrival.coords.lat = $scope.arrivalAutocomplete.getPlace().geometry.location.lat();
				vm.inputData.arrival.coords.lon = $scope.arrivalAutocomplete.getPlace().geometry.location.lng();
			}, 500);
		}
	};



	vm.sendRequest = function(input) {
		var requestParams = {
			"locations": [
				{
					"lat": vm.inputData.departure.coords.lat || vm.currentPosition.lat,
					"lon": vm.inputData.departure.coords.lon || vm.currentPosition.lon
					// "type": "break"
				},
				{
					"lat": vm.inputData.arrival.coords.lat,
					"lon": vm.inputData.arrival.coords.lon
					// "type": "break"
				}	
			],
			"costing": "multimodal",
			"directions_options": { "units":"miles" }
		}
		var url = 'https://valhalla.mapzen.com/route?json='+JSON.stringify(requestParams)+'&api_key=valhalla-m9bds2x'.replace('%22', '');

		$http({
			method: 'GET',
			url: url,
		}).then(function(response) {
			console.log('sendRequest response: ', response);
			vm.tripData = response.data.trip;
		}).catch(function(e) {
			console.log('RequestService.send error: ', e);
		});
	};

	// vm.autoAddress = function(input) {
	// 	// get users current location 

	// 	console.log('autoAddress: ', input);

	// 	var autoBaseUrl = 'https://search.mapzen.com/v1/autocomplete';
	// 	var mapzenSearchKey = 'search-3LVgAzp';
	// 	var url = autoBaseUrl+
	// 			  '?api_key='+mapzenSearchKey+
	// 			  '&focus.point.lat='+vm.currentPosition.lat+
	// 			  '&focus.point.lon='+vm.currentPosition.lon+
	// 			  '&text='+input;

	// 	$http({
	// 		method: 'GET',
	// 		url: url
	// 	}).then(function(response) {
	// 		console.log('autoAddress response: ', response);
	// 		var suggestions = [];
	// 		response.data.features.forEach(function(item) {
	// 			suggestions.push({
	// 				label: item.properties.label,
	// 				value: item.properties
	// 			});
	// 		});
	// 		console.log('suggestions: ', suggestions);
	// 		vm.suggestions = suggestions;
	// 	})
	// 	.catch(function(e) {
	// 		console.log('autoAddress error: ', e);
	// 	});

	// };
}]);
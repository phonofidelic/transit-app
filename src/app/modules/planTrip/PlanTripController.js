'use-strict';
angular.module('transitApp')
.controller('PlanTripController', [
	'$scope', 
	'$http',
	'$log', 
	'$timeout', 
	'RequestService', 
	'LocationService', 
	'TransitLandRequestService', 
	'GTFSParserService',
	function($scope, $http, $log, $timeout, RequestService, LocationService, TransitLandRequestService, GTFSParserService) {

	var vm = this;
	var requestService = new RequestService();
	var locationService = new LocationService();
	var transitService = new TransitLandRequestService();
	var gtfsParserService = new GTFSParserService();
	var jsZip = new JSZip();

	var map = L.map('map', {
		scrollWheelZoom: false
	});

	vm.gtfsParserService = new GTFSParserService();

	vm.inputData = {};
	vm.inputData.departure = {};
	vm.inputData.departure.coords = {};
	vm.inputData.arrival = {};
	vm.inputData.arrival.coords = {};
	vm.currentPosition = {};
	// vm.showToast = false;

	function openDatabase() {
		if (!navigator.serviceWorker) {
			return Promise.resolve();
		}
		console.log('initiating database');
		return idb.open('gtfsData', 1, function(upgradeDb) {
			var store = upgradeDb.createObjectStore('stops', {
				keyPath: 'stop_id'
			});
			store.createIndex('by-id', 'stop_id');
		});
	};

	function registerServiceWorker() {
		if (!navigator.serviceWorker) return;

		navigator.serviceWorker.register('/sw.js').then(function(reg) {
			console.log('serviceWorker registered!');
			if (!navigator.serviceWorker.controller) {
				return;
			}

			if (reg.waiting) {
				updateReady(reg.waiting);
				return;
			}

			if (reg.installing) {
				trackInstalling(reg.installing);
				return;
			}

			reg.addEventListener('updatefound', function() {
				console.log('*** updatefound ***');
				trackInstalling(reg.installing);
			});

			// *** BUG *** 	not picking up change-event?
			var refreshing;
			navigator.serviceWorker.addEventListener('controllerchange', function() {
				console.log('*** controllerchange ***');
				if (refreshing) return;
				console.log('*** reload ***');
				window.location.reload(); // not getting called
				refreshing = true;
			});
		}).catch(function(err) {
			console.log('serviceWorker registration error: ', err);
		});
	};

	function trackInstalling(worker) {
		console.log('trackInstalling');
		worker.addEventListener('statechange', function() {
			if (worker.state == 'installed') {
				updateReady(worker);
			}
		});
	};

	function updateReady(worker) {
		console.log('updateReady');
		// show notification that an update is ready
		vm.showToast = true;
		// TODO: implement refresh/skip waiting functionality
		vm.skipWaiting = function() {
			worker.postMessage({action: 'skipWaiting'});
			location.reload();
			console.log('skip, ', worker);
		}
	};

	vm.init = function() {
		openDatabase();
		registerServiceWorker();
	}

	/************* zip file test *************/
	vm.readZip = function() {
		// $http({
		// 	method: 'GET',
		// 	url: 'http://www.broward.org/bct/google/latest/google_transit.zip',
		// 	headers: {
		// 		'Access-Control-Allow-Origin': 'http://www.broward.org'
		// 	}
		// }).then(function(zipFile) {
		// 	console.log('success!')
		// }).catch(function(err) {
		// 	console.log('readZip failed: ', err);
		// });

		JSZipUtils.getBinaryContent('assets/transitData/google_transit.zip', function(err, data) {
			if (err) {
				console.log('JSZip error: ');
				throw err;
			}
			jsZip.loadAsync(data).then(function(zip) {
				console.log('success!: ', zip);
				return jsZip.file('stops.txt').async('string');
			}).then(function(string) {
				console.log('zip string: ', string);
				return string;
			}).catch(function(err) {
				console.error('readZip error: ', err);
			});
		});
	}
	/************* endtest *******************/

	// GTFS data request
	vm.gtfsData = function() {
		var url = 'assets/transitData/google_transit.zip';
		var file = 'stops.txt';

		console.log('testing... ', gtfsParserService.readZip(url, 'stops.txt'));

		JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				console.log('JSZip error: ');
				throw err;
			}
			jsZip.loadAsync(data).then(function(zip) {
				return jsZip.file(file).async('string');
			}).then(function(string) {
				return gtfsParserService.toArrays(string);
			}).then(function(gtsfArray) {
				return gtfsParserService.toJSON(gtsfArray);
			}).then(function(gtsfJSON) {
				console.log('gtsfJSON: ', gtsfJSON);
			}).catch(function(err) {
				console.log('readZip error: ', err);
			});
		});

		// gtfsParserService.readZip(url, 'stops.txt').then(function(string) {
		// 	return gtfsParserService.toArrays(string);
		// }).then(function(array) {
		// 	console.log('grfs array: ', array);
		// 	return gtfsParserService.toJSON(array);
		// }).then(function(jsonData) {
		// 	console.log('jsonData: ', jsonData);
		// 	result = gtfsParserService.groupBy(jsonData, function(item) {
		// 		return [item.stop_id];
		// 	});
		// 	console.log('result: ', result[0]);
		// 	result[0].forEach(function(item) {
		// 		console.log(item.departure_time)
		// 	});			
		// });

		// gtfsParserService.requestData(url).then(function(response) {
		// 	console.log('GTFSParserService response: ', response);
		// 	return gtfsParserService.toJSON(response);	
		// })
		// .then(function(jsonData) {
		// 	console.log('jsonData: ', jsonData);
		// 	result = gtfsParserService.groupBy(jsonData, function(item) {
		// 		return [item.stop_id];
		// 	});
		// 	console.log('result: ', result[0]);
		// 	result[0].forEach(function(item) {
		// 		console.log(item.departure_time)
		// 	})
		// });
	};

	vm.gtfsToJSON = function() {
		$.get('http://localhost:3000/assets/transitData/calendar.txt', function(data) {
			console.log('toJSON: ', data);
		});
	};

	// Retrieve list of routes serviced by operator 
	vm.transitRequest = function(region) {
		transitService.routesByOperator(region).then(function(response) {
			vm.routeData = response.data.routes;
			console.log('transitRequest response: ', response);
		});
	};

	vm.getStopInifo = function() {
		console.log('getStopInifo: ');
		vm.routeData[0].stops_served_by_route.forEach(function() {
			transitService.getStopInfo(this.onestop_id);
		});
	};

	vm.routeBetween = function(dep_onestop_id, arr_onestop_id) {
		transitService.routeBetween(dep_onestop_id, arr_onestop_id).then(function(response) {
			console.log('controller routeBetween response: ', response);
		});
	};

	vm.routeRequest = function(onestop_id) {
		transitService.routeByOnestopId(onestop_id).then(function(response) {
			vm.routeData = response.data.routes;
			console.log('routeRequest response: ', response);
		});
	};

	vm.scheduleStopPairs = function(onestop_id) {
		if (vm.scheduleStopPairs) { vm.scheduleStopPairs = []; }
		transitService.scheduleStopPairs(onestop_id).then(function(response) {
			console.log('scheduleStopPairs: ', response);
			vm.scheduleStopPairs = response;
		});
	};

	// Get rout stop pattern by a routes onestop id
	vm.routeStopPattern = function(routeId) {
		transitService.routeStopPattern(routeId).then(function(response) {
			var queryString = '';
			response.forEach(function(stop) {
				queryString+= stop+",";
			});
			queryString = queryString.slice(0, -1);

			// Get data for all stops in stop pattern
			$http.get('http://transit.land/api/v1/stops?onestop_id='+queryString+'&per_page=100').then(function(response) {
				console.log('stops from routeStopPattern: ', response);
				console.log('stop names: ');
				response.data.stops.forEach(function(stop) {
					console.log(stop.name);
				});
				
			});
		});
	}

	vm.getCurrentPosition = function() {
		var position = locationService.getCurrentPosition().then(function(position) {
			console.log('getPosition result: ', position.coords);
			vm.currentPosition.lat = position.coords.latitude;
			vm.currentPosition.lon = position.coords.longitude;
			return position.coords;
		}).then(function(position) {
			locationService.revGeocode(position).then(function(results) {
				console.log('region: ', results.address_components[3].short_name);
				vm.currentPosition.addressString = results.formatted_address;
				// vm.currentPosition.countyString = results.address_components[3].short_name;
				vm.currentPosition.countyString = 'o-dhw-browardcountytransit';
			});
		});		
	};

	vm.autoAddress = function(id) {
		var input = document.getElementById(id);
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
				console.log('locationData: ', $scope.departureAutocomplete.getPlace());
				if ($scope.departureAutocomplete.getPlace()) {
					vm.inputData.departure.name = $scope.departureAutocomplete.getPlace().formatted_address;
					vm.inputData.departure.coords.lat = $scope.departureAutocomplete.getPlace().geometry.location.lat();
					vm.inputData.departure.coords.lon = $scope.departureAutocomplete.getPlace().geometry.location.lng();
				}
			}, 500);
		} else {
			$timeout(function() {
				console.log('*** getAddress ***');
				console.log('locationData: ', $scope.arrivalAutocomplete.getPlace());
				if ($scope.arrivalAutocomplete.getPlace()) {
					vm.inputData.arrival.name = $scope.arrivalAutocomplete.getPlace().formatted_address;
					vm.inputData.arrival.coords.lat = $scope.arrivalAutocomplete.getPlace().geometry.location.lat();
					vm.inputData.arrival.coords.lon = $scope.arrivalAutocomplete.getPlace().geometry.location.lng();
				}
			}, 500);
		}
	};

	// Retrieve route info between current position or departure input value
	// and arrival input value
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
			"costing_options": {
				"transit": {
					"use_bus": 0.1,
					"use_rail": 1.0
				}
			},
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

	function addMarker(coords) {
		return L.marker(coords).addTo(map);
	};

	vm.initMap = function() {
		
		// // Leaflet map
		// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		//   	attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
		//   	maxZoom: 18
		// }).addTo(map);

		// Tangram map
		var layer = Tangram.leafletLayer({
	  		scene: 'https://raw.githubusercontent.com/tangrams/refill-style-more-labels/gh-pages/refill-style-more-labels.yaml',
	  		attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
		});
		layer.addTo(map);

		// gets current position and initializez map with those coords
		locationService.getCurrentPosition().then(function(position) {
			map.setView([position.coords.latitude, position.coords.longitude], 14);

			// create bounding boxs area to illustrate routesByBbox search area
			var latLangs = [];
			var swLatlng = L.latLng(position.coords.latitude + 0.05, position.coords.longitude - 0.05),
				nwLatlng = L.latLng(position.coords.latitude + 0.05, position.coords.longitude + 0.05),
				neLatlng = L.latLng(position.coords.latitude - 0.05, position.coords.longitude + 0.05),
				seLatlng = L.latLng(position.coords.latitude - 0.05, position.coords.longitude - 0.05);

			latLangs.push(swLatlng, nwLatlng, neLatlng, seLatlng, swLatlng);

			var boundsLine = L.polyline(latLangs, {color: 'red', fill: 'green'}).addTo(map);
			map.fitBounds(boundsLine.getBounds());

		}).catch(function(e) {
			console.log('getPosition error: ', e);
		});	

		var geocode = L.control.geocoder('search-3LVgAzp').addTo(map);

		/* Leaflet.Locate
			https://github.com/domoritz/leaflet-locatecontrol
		 */
		var lc = L.control.locate({
			position: 'topleft',
			keepCurrentZoomLevel: true
		}).addTo(map);
		lc.start();

		$log.log('init map');
		return map;
	};

	vm.routesByBbox = function(coords) {
		transitService.routesByBbox(coords);
	};
	// test git-config
}]);
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
		// zoom: 1
	});

	vm.gtfsParserService = new GTFSParserService();

	vm.inputData = {};
	vm.inputData.departure = {};
	vm.inputData.departure.coords = {};
	vm.inputData.arrival = {};
	vm.inputData.arrival.coords = {};
	vm.currentPosition = {};
	vm.dbPromise = openDatabase();

	function openDatabase() {
		if (!navigator.serviceWorker) {
			return Promise.resolve();
		}
		console.log('initiating database');
		return idb.open('gtfsData', 7, function(upgradeDb) {
			switch (upgradeDb.oldVersion) {
				case 0: 
					var stopsStore = upgradeDb.createObjectStore('stops', {
						keyPath: 'stop_id'
					});
					stopsStore.createIndex('by-id', 'stop_id');
				case 1:
					var tripsStore = upgradeDb.createObjectStore('trips', {
						keyPath: 'trip_id'
					});
					tripsStore.createIndex('by-id', 'trip_id');
				case 2: 
					var stopTimesStore = upgradeDb.createObjectStore('stop_times', {
						keyPath: 'stop_id'
					});
					stopTimesStore.createIndex('by-id', 'stop_id');
				case 3:
					var routesStore = upgradeDb.createObjectStore('routes', {
						keyPath: 'route_id'
					});
					routesStore.createIndex('by-id', 'route_id');
			}
			// var stopsStore = upgradeDb.createObjectStore('stops', {
			// 	keyPath: 'stop_id'
			// });
			// stopsStore.createIndex('by-id', 'stop_id');
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

	function getStoredData() {
		return vm.dbPromise.then(function(db) {
			if (!db /* || this.someView.showingSomething() */) return;

			var index = db.transaction('stops')
			.objectStore('stops').index('by-id');

			return index.getAll().then(function(stops) {
				console.log('from idb: ', stops);
			});
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

	// TODO: make populateDb only store data for selected 
	// endpoints to cut down on load time.
	function populateDb() {
		// populate db with stops
		gtfsData('stops.txt').then(function(transitData) {
			vm.dbPromise.then(function(db) {
				if (!db) return;

				var txStops = db.transaction('stops', 'readwrite');
				var store = txStops.objectStore('stops');
				transitData.forEach(function(item) {
					store.put(item, item.stop_id);
				});
			});
		});

		//populate db with trips
		gtfsData('trips.txt').then(function(transitData) {
			vm.dbPromise.then(function(db) {
				if (!db) return;

				var txTrips = db.transaction('trips', 'readwrite');
				var store = txTrips.objectStore('trips');
				transitData.forEach(function(item) {
					store.put(item, item.trip_id);
				});
			});
		});

		//populate db with stop-times
		gtfsData('stop_times.txt').then(function(transitData) {
			vm.dbPromise.then(function(db) {
				if (!db) return;

				var txTrips = db.transaction('stop_times', 'readwrite');
				var store = txTrips.objectStore('stop_times');
				transitData.forEach(function(item) {
					store.put(item, item.stop_id);
				});
			});
		});
	};

	vm.init = function() {
		// openDatabase();
		// populateDb();
		registerServiceWorker();
	};

	vm.deleteObjectStore = function(objectStore) {

	}

	// GTFS data request
	function gtfsData(file) {
		var url = 'assets/transitData/google_transit.zip';
		var file = file;

		// console.log('testing... ', gtfsParserService.readZip(url, 'stops.txt'));

		return new Promise(function(resolve) {


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
					resolve(gtsfJSON);
				}).catch(function(err) {
					console.log('readZip error: ', err);
				});
			});
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

	vm.initMap = function() {
		
		// // Leaflet map
		// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		//   	attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
		//   	maxZoom: 18
		// }).addTo(map);

		// Tangram map
		var layer = Tangram.leafletLayer({
	  		scene: 'https://raw.githubusercontent.com/tangrams/refill-style-more-labels/gh-pages/refill-style-more-labels.yaml',
	  		attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
		});
		layer.addTo(map);

		// gets current position and initializez map with those coords
		locationService.getCurrentPosition().then(function(position) {
			map.setView([position.coords.latitude, position.coords.longitude], 14);

			// // create bounding boxs area to illustrate routesByBbox search area
			// var latLangs = [];
			// var swLatlng = L.latLng(position.coords.latitude + 0.05, position.coords.longitude - 0.05),
			// 	nwLatlng = L.latLng(position.coords.latitude + 0.05, position.coords.longitude + 0.05),
			// 	neLatlng = L.latLng(position.coords.latitude - 0.05, position.coords.longitude + 0.05),
			// 	seLatlng = L.latLng(position.coords.latitude - 0.05, position.coords.longitude - 0.05);

			// latLangs.push(swLatlng, nwLatlng, neLatlng, seLatlng, swLatlng);

			// var boundsLine = L.polyline(latLangs, {color: 'red', fill: 'green'}).addTo(map);
			// // map.fitBounds(boundsLine.getBounds());

			return position;
		}).then(function(position) {
			console.log('*** position: ', position);
			var coords = {
				lat: position.coords.latitude,
				lon: position.coords.longitude
			}
			transitService.routesByBbox(coords).then(function(response) {
				var localRoutes = response.routes.filter(function(route) {
					if (route.operated_by_onestop_id === 'o-dhw-browardcountytransit') {
						return route;
					}
				});

				vm.routes = response.routes;
				// updates view to with routes data
				// http://stackoverflow.com/questions/15475601/angularjs-ng-repeat-list-is-not-updated-when-a-model-element-is-spliced-from-th
				$scope.$apply();
				console.log('*** vm.routes: ', vm.routes);
				
				localRoutes.forEach(function(route) {
						
					var routeColor = route.color;
					var lines = route.geometry.coordinates;

					lines.forEach(function(line) {
						var latLngs = [];
						line.forEach(function(coord) {
							latLngs.push(L.latLng(coord[1], coord[0]));
						});
						// add line to map
						var routeLine = L.polyline(latLngs, { color: '#'+routeColor }).addTo(map);
						// map.fitBounds(routeLine.getBounds());
					});				
				});
			}).then(function() {
				//populate db with routes
				gtfsData('routes.txt').then(function(transitData) {
					vm.dbPromise.then(function(db) {
						if (!db) return;

						var selectedRoutes = [];

						vm.routes.forEach(function(item) {
							transitData.forEach(function(item2) {
								if (item.name === item2.route_short_name) {
									selectedRoutes.push(item2);
								}
							});
						});

						console.log('*** selectedRoutes: ', selectedRoutes)
			
						var tx = db.transaction('routes', 'readwrite');
						var store = tx.objectStore('routes');
						selectedRoutes.forEach(function(item) {
							store.put(item);
						});
						return selectedRoutes;
					}).then(function(selectedRoutes) {
						gtfsData('trips.txt').then(function(transitData) {
								vm.dbPromise.then(function(db) {
									if (!db) return;

									var selectedTrips = [];
									console.log('### ', selectedRoutes)

									selectedRoutes.forEach(function(item) {
										transitData.forEach(function(item2) {
											if (item2.route_id === item.route_id) {
												selectedTrips.push(item2);
											}
										});
									});

									console.log('## selectedTrips: ', selectedTrips)

									var tx = db.transaction('trips', 'readwrite');
									var store = tx.objectStore('trips');
									selectedTrips.forEach(function(trip) {
										store.put(trip);
									});
								});
							});
					});
				});
			});
		}).catch(function(e) {
			console.log('getPosition error: ', e);
		});	

		// add stop markers
		// gtfsData('stops.txt').then(function(stops) {
		// 	var stopCoords = [];
		// 	var latLngs = [];
		// 	stops.forEach(function(stop){
		// 		// console.log('stop: ', stop.stop_lat)
		// 		if (stop.stop_lat && stop.stop_lon) {
		// 			var latlng = L.latLng(stop.stop_lat, stop.stop_lon);	
		// 		}				
		// 		latLngs.push(latlng);
		// 	});
		// 	console.log('latLngs: ', latLngs)
		// 	return latLngs;
		// }).then(function(latLngs) {
			
		// 	latLngs.forEach(function(latLng) {
		// 		L.marker(latLng).addTo(map)
		// 	});
		// });

		// add route line
		// var routeLine = L.polyline()



		// var geocode = L.control.geocoder('search-3LVgAzp').addTo(map);

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
		transitService.routesByBbox(coords).then(function(response) {
			var localRoutes = response.routes.filter(function(route) {
				if (route.operated_by_onestop_id === 'o-dhw-browardcountytransit') {
					return route;
				}
			});

			vm.routes = response.routes;
			console.log('*** vm.routes: ', vm.routes);
			console.log('### testing ###')
			localRoutes.forEach(function(route) {
					
				var routeColor = route.color;
				var lines = route.geometry.coordinates;

				lines.forEach(function(line) {
					var latLngs = [];
					line.forEach(function(coord) {
						latLngs.push(L.latLng(coord[1], coord[0]));
					});
					// add line to map
					var routeLine = L.polyline(latLngs, { color: '#'+routeColor }).addTo(map);
					// map.fitBounds(routeLine.getBounds());
				});		
			});
		}).catch(function(err) {
			console.log('Routes setup errpr: ', err);
		});
	};

}]);
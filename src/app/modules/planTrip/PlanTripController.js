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

	vm.currentTime = moment().format('hh:mm:ss');
	console.log('current time:', vm.currentTime)
	// vm.routes = [];
	var _dbPromise = openDatabase();

	function openDatabase() {
		if (!navigator.serviceWorker) {
			return Promise.resolve();
		}
		console.log('initiating database');
		return idb.open('gtfsData', 9, function(upgradeDb) {
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
					tripsStore.createIndex('by-route-id', 'route_id');
				case 2: 
					var stopTimesStore = upgradeDb.createObjectStore('stop_times', {
						keyPath: 'stop_id'
					});
					stopTimesStore.createIndex('by-trip-id', 'trip_id');
					stopTimesStore.createIndex('by-stop-id', 'stop_id');
				case 3:
					var routesStore = upgradeDb.createObjectStore('routes', {
						keyPath: 'onestop_id'
					});
					routesStore.createIndex('by-name', 'route_short_name');
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
		return _dbPromise.then(function(db) {
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
		_gtfsData('stops.txt').then(function(transitData) {
			_dbPromise.then(function(db) {
				if (!db) return;

				var txStops = db.transaction('stops', 'readwrite');
				var store = txStops.objectStore('stops');
				transitData.forEach(function(item) {
					store.put(item, item.stop_id);
				});
			});
		});

		//populate db with trips
		_gtfsData('trips.txt').then(function(transitData) {
			_dbPromise.then(function(db) {
				if (!db) return;

				var txTrips = db.transaction('trips', 'readwrite');
				var store = txTrips.objectStore('trips');
				transitData.forEach(function(item) {
					store.put(item, item.trip_id);
				});
			});
		});

		//populate db with stop-times
		_gtfsData('stop_times.txt').then(function(transitData) {
			_dbPromise.then(function(db) {
				if (!db) return;

				var txTrips = db.transaction('stop_times', 'readwrite');
				var store = txTrips.objectStore('stop_times');
				transitData.forEach(function(item) {
					store.put(item, item.stop_id);
				});
			});
		});
	};

	// vm.init = function() {
		// openDatabase();
		// populateDb();
		// registerServiceWorker();
	// };

	// GTFS data request
	function _gtfsData(file) {
		var url = 'assets/transitData/google_transit.zip';		//**************************** !!!hardcoded!!!
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
					// console.log('gtsfJSON: ', gtsfJSON);
					resolve(gtsfJSON);
				}).catch(function(err) {
					console.log('readZip error: ', err);
				});
			});
		});
	};

	function _storeTrips(selectedRoute) {
		_gtfsData('trips.txt').then(function(transitData) {
			_dbPromise.then(function(db) {
				if (!db) return;

				var selectedTrips = [];
				var tx = db.transaction('trips', 'readwrite');
				var store = tx.objectStore('trips');

				transitData.forEach(function(transitDataItem) {
					if (selectedRoute.route_id === transitDataItem.route_id) {
						store.put(transitDataItem);
						selectedTrips.push(transitDataItem);
					}
				});
				console.log('selectedTrips:', selectedTrips);
				_getTripsForRoute(selectedTrips, selectedRoute);
				return selectedTrips;
			}).then(function(selectedTrips) {
				_getStopTimes(selectedTrips, selectedRoute);
			}).catch(function(err) {
				console.error('Could not store trips for selected route:', err);
			});
		}).catch(function(err) {
			console.error('Error reading trips.txt:', err);
		});
	};

	function _getTripsForRoute(selectedTrips, selectedRoute) {
		selectedRoute.trips = [];
		_dbPromise.then(function(db) {
			if (!db) return;

			var tx = db.transaction('trips');
			var store = tx.objectStore('trips');
			var tripIndex = store.index('by-route-id');

			// vm.tripsLoading = true;
			$scope.$apply();
			return tripIndex.openCursor();
		}).then(function(cursor) {
			if (!cursor) return;
			return cursor.advance(1);
		}).then(function storeValue(cursor) {
			if (!cursor) return;

			if (selectedRoute.route_id === cursor.value.route_id) {
				selectedRoute.trips.push(cursor.value);
			}
			return cursor.continue().then(storeValue);	
		}).then(function() {
			console.log('done cusoring:');
			vm.tripsLoading = false;
			$scope.$apply();
			console.log(selectedRoute);
		}).catch(function(err) {
			console.error('IDB cursor error:', err);
		});
	};

	function _getStopTimes(selectedTrips, selectedRoute) {
		_gtfsData('stop_times.txt').then(function(transitData) {
			_dbPromise.then(function(db) {
				if (!db) return;

				var tx = db.transaction('stop_times', 'readwrite');
				var store = tx.objectStore('stop_times');

				console.log('selectedRoute.route_id:', selectedRoute.route_id)
				transitData.forEach(function(stopTime) {
					if (stopTime.trip_id === selectedTrips[0].trip_id) {
						store.put(stopTime);
					}
				});
				console.log('stop_times done')
			}).catch(function(err) {
				console.log('Could not collect stop_times:', err);
			});
		}).catch(function(err) {
			console.error('Could not read stop_times.txt:', err);
		});
	};

	function _getTrips(selectedRouteId) {
		var selectedTrips = [];
		_dbPromise.then(function(db) {
			var tx = db.transaction('trips');
			var store = tx.objectStore('trips');
			var routeIdIndex = store.index('by-route-id');
			return routeIdIndex.openCursor();	
		}).then(function(cursor) {
			if (!cursor) return;
			return cursor.advance(1);
		}).then(function logValue(cursor) {
			if (!cursor) return;
			if (cursor.value.route_id === selectedRouteId.name) {
				console.log('cursor at: ', cursor.value.trip_id);
				selectedTrips.push(cursor.value);
			}
		}).catch(function(err) {
			console.error('Could not retrieve trips data from idb:', err);
		});
		console.log('selectedTrips:',selectedTrips);
	}

	function _storeRoutes(routes) {
		// *** populate db with routes ***
		_gtfsData('routes.txt').then(function(transitData) {
			_dbPromise.then(function(db) {
				if (!db) return;

				var selectedRoutes = [];

				routes.forEach(function(transitlandItem) {
					transitData.forEach(function(idbItem) {
						if (transitlandItem.name === idbItem.route_short_name) {
							// transfer data from transitland to stored db entry
							idbItem.onestop_id = transitlandItem.onestop_id;

							// combine transitland and gtfs data
							var combinedObj = collect(idbItem, transitlandItem);
							selectedRoutes.push(combinedObj);
						}
					});
				});
				vm.routes = selectedRoutes;
				$scope.$apply();						
				console.log('*** vm.routes: ', vm.routes)
	
				var tx = db.transaction('routes', 'readwrite');
				var store = tx.objectStore('routes');
				selectedRoutes.forEach(function(item) {
					store.put(item);
				});

				return selectedRoutes;
			});
		}).catch(function(err) {
			console.error('Could not read gtfs data from routes.txt:', err);
		});
	};

	function _getRoutes(position) {
		var coords = {
			lat: position.coords.latitude,
			lon: position.coords.longitude
		}
		transitService.routesByBbox(coords).then(function(response) {
		// transitService.getStaticRoutes().then(function(response) {	//**************************** mock data
			// var routes = response.routes;
			var routes = response.routes.filter(function(route) {
				var operators = ['o-c20-trimet', 'o-dhw-browardcountytransit'];
				if (route.operated_by_onestop_id === operators[1]) {	//************************ !!!hardcoded!!!
					return route;
				}
			});

			vm.currentPosition.countyString = routes[0].operated_by_onestop_id;

			// updates view to with routes data
			// http://stackoverflow.com/questions/15475601/angularjs-ng-repeat-list-is-not-updated-when-a-model-element-is-spliced-from-th
			$scope.$apply();
			// console.log('*** routes: ', routes);
			
			// set up each route
			routes.forEach(function(route) {
					
				var routeColor; 
				if (route.color === null || route.color === undefined) {
					var color = randomColor({
						luminosity: 'bright'
						// hue: 'random'
					});
					color = color.replace('#', '');
					route.color = color;
					// $scope.$apply();
				}

				var lines = route.geometry.coordinates;

				lines.forEach(function(line) {
					var latLngs = [];
					line.forEach(function(coord) {
						latLngs.push(L.latLng(coord[1], coord[0]));
					});
					// add line to map
					var routeLine = L.polyline(latLngs, { color: '#'+route.color }).addTo(map);
					// map.fitBounds(routeLine.getBounds());
				});

				route.active = false;
			});

			vm.routes = routes;
			$scope.$apply();	//*************** needed to update view with new model state
			return vm.routes;
		}).then(function(routes) {
			_checkScroll();
			_storeRoutes(routes);
		}).catch(function(err) {
			console.error('transitService.routesByBbox request error: ', err);
		});
	};

	var markersAdded = false;
	var markerLayer;
	function _addMarkers(stops, color) {
		if (markersAdded) {
			map.removeLayer(markerLayer);	
		}
		
		markerLayer = new L.FeatureGroup();
		var latLngs = [];
		var vectorMarker = L.VectorMarkers.icon({
			icon: 'bus',
			markerColor: '#'+color,
			prefix: 'fa'
		});
		stops.forEach(function(stop) {
			// if (stop.stop_lat && stop.stop_lon) {
				var latlng = L.latLng(stop.stop_lat, stop.stop_lon);
			// }
			latLngs.push(latlng);
		});
		latLngs.forEach(function(latLng) {
			// L.marker(latLng).addTo(map);
			markerLayer.addLayer(L.marker(latLng, {icon: vectorMarker}));
		});
		console.log('### add marker ###', markersAdded)
		markersAdded = true;
		map.addLayer(markerLayer);
		$scope.$apply();
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

	vm.routeBetween = function(route) {
		var arrLength = route.stops_served_by_route.length
		console.log('arrLength: ', arrLength)
		var dep_onestop_id = route.stops_served_by_route[0].stop_onestop_id;
		var arr_onestop_id = route.stops_served_by_route[arrLength - 1].stop_onestop_id;
		console.log('arr_onestop_id: ', arr_onestop_id)
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
				vm.currentPosition.countyString = 'o-dhw-browardcountytransit';		//****************************** !!!hardcoded!!!
			});
		});		
	};

	// vm.autoAddress = function(id) {
	// 	var input = document.getElementById(id);
	// 	var options = {
	// 		types: ['address']
	// 	};
	// 	if (input.id === 'departure-inp') {
	// 		$scope.departureAutocomplete = new google.maps.places.Autocomplete(input, options);
	// 	} else {
	// 		$scope.arrivalAutocomplete = new google.maps.places.Autocomplete(input, options);
	// 	}
	// };

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

	function _setBboxLine(position) {
			// create bounding boxs area to illustrate routesByBbox search area
			var latLangs = [];
			var swLatlng = L.latLng(position.coords.latitude + 0.05, position.coords.longitude - 0.05),
				nwLatlng = L.latLng(position.coords.latitude + 0.05, position.coords.longitude + 0.05),
				neLatlng = L.latLng(position.coords.latitude - 0.05, position.coords.longitude + 0.05),
				seLatlng = L.latLng(position.coords.latitude - 0.05, position.coords.longitude - 0.05);

			latLangs.push(swLatlng, nwLatlng, neLatlng, seLatlng, swLatlng);

			var boundsLine = L.polyline(latLangs, {color: 'red', fill: 'green'}).addTo(map);
			// map.fitBounds(boundsLine.getBounds());
	}

	function _checkScroll() {
		// *** set up scroll behavior for route list ***
		var secondItem = $('.routeButtonSecond');
		var firstItem = $('.routeButtonFirst');

		// if (secondItem.offset().top < firstItem.offset().top) {
		// 	// $('.notFirst').css('visibility', 'hidden');
		// }
		window.onscroll = function() {
			if (firstItem.offset().top >= secondItem.offset().top) {
				firstItem.removeClass('stuck');
			}

			if ($(document).scrollTop() + window.innerHeight < firstItem.offset().top + 50) {
				firstItem.addClass('stuck');
			}
		};
	};

	vm.init = function() {
		// registerServiceWorker();
	};

	vm.initMap = function() {
		registerServiceWorker();

		// Tangram map
		var layer = Tangram.leafletLayer({
	  		scene: 'https://raw.githubusercontent.com/tangrams/refill-style-more-labels/gh-pages/refill-style-more-labels.yaml',
	  		attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
		});
		layer.addTo(map);

		// gets current position and initializez map with those coords
		locationService.getCurrentPosition().then(function(position) {
		// locationService.getStaticPosition().then(function(position) {	//**************************** mock data
			console.log('position:', position)
			map.setView([position.coords.latitude, position.coords.longitude], 14);

			// _setBboxLine(position);

			return position;
		}).then(function(position) {
			console.log('*** position: ', position);

			_getRoutes(position);
		
		}).catch(function(err) {
			console.log('getPosition error: ', err);
		});	

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





	vm.setColor = function(route) {
		return {background: '#'+route.color};
	}

	// *** source ***	 http://stackoverflow.com/questions/2454295/how-to-concatenate-properties-from-multiple-javascript-objects
	function collect() {
		var ret = {};
		var len = arguments.length;
		for (var i = 0; i < len; i++) {
			for (p in arguments[i]) {
				if (arguments[i].hasOwnProperty(p)) {
					ret[p] = arguments[i][p];
				}
			}
		}
		return ret;
	};

	vm.selectRoute = function(selectedRoute) {
		// set currently selected route
		vm.selectedRoute = selectedRoute;
		
		// get stops data from gtfs
		_gtfsData('stops.txt').then(function(transitData) {
			function findStopInRoute(routeStops, gtfsStop) {
				return routeStops.find(function(stop) {
					if (stop.stop_name === gtfsStop.stop_name) {
						return stop;
					}
				});
			};
			
			selectedRoute.collectedStops = [];
			_dbPromise.then(function(db) {
				if (!db) return;
				var tx = db.transaction('stops', 'readwrite');
				var store = tx.objectStore('stops');
				
				transitData.forEach(function(gtfsStop) {
					if (findStopInRoute(selectedRoute.stops_served_by_route, gtfsStop)) {
						selectedRoute.stops_served_by_route.forEach(function(stop) {
							if (gtfsStop.stop_name === stop.stop_name) {
								var collectedStop = collect(gtfsStop, stop)
								selectedRoute.collectedStops.push(collectedStop);
								store.put(collectedStop);
							}
						});
					}
				});
			});
			
			return selectedRoute;
		}).then(function(selectedRoute) {
			_addMarkers(selectedRoute.collectedStops, selectedRoute.color);
			_storeTrips(selectedRoute);
			return selectedRoute;
		})
		// .then(function(selectedRoute) {	//**************** stop times
		// 	selectedRoute.collectedStops.forEach(function(stop) {
		// 		stop.stopTimes = [];	
		// 	});
			
		// 	_dbPromise.then(function(db) {
		// 		if (!db) return;
		// 		var tx = db.transaction('stop_times');
		// 		var store = tx.objectStore('stop_times');
		// 		var timeIndex = store.index('by-trip-id');

		// 		return timeIndex.openCursor();
		// 	}).then(function(cursor) {
		// 		if (!cursor) return;
		// 		return cursor.advance(1);
		// 	}).then(function storeTime(cursor) {
		// 		if (!cursor) return;
		// 		selectedRoute.collectedStops.forEach(function(stop) {
		// 			// go through idb stop_times and pull ech entry 
		// 			// that has a matching stop_id
					
		// 			if (stop.stop_id === cursor.value.stop_id) {
		// 				console.log('stop time: ', cursor.value)
		// 				console.log('stop.stop_id:', stop.stop_id)
		// 				console.log('cursor.value.stop_id:', cursor.value.stop_id)
		// 				var stopTime = cursor.value;
		// 				stop.stopTimes.push(stopTime);
		// 				$scope.$apply();
		// 			}
		// 		})
		// 		return cursor.continue().then(storeTime);
		// 	}).then(function() {
		// 		console.log('done time cursoring:', selectedRoute)
		// 	})


		// })
		.catch(function(err) {
			console.error('Could not collect stops data: ', err);
		});
		console.log('selectedRoute: ', selectedRoute);
	};

	vm.transitionToMap = function() {
		$('body').scrollTop(0);
		console.log('scroll top')
	}

	vm.testFunction = function() {
		console.log('hello world!');
	};

}]);
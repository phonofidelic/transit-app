angular.module('transitApp').controller('MapController', ['$scope', '$log','LocationService', function($scope, $log, LocationService) {
	var vmMap = this;
	var map = L.map('map');
	var locationService = new LocationService();


	vmMap.init = function() {
		

		// // Leaflet map
		// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		//   	attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'})
		// 	.addTo(map);

		// Tangram map
		var layer = Tangram.leafletLayer({
	  		scene: 'https://raw.githubusercontent.com/tangrams/refill-style-more-labels/gh-pages/refill-style-more-labels.yaml',
	  		attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
		});
		layer.addTo(map);

		// gets current position and initializez map with those coords
		locationService.getCurrentPosition().then(function(position) {
			map.setView([position.coords.latitude, position.coords.longitude], 16);
		}).catch(function(e) {
			console.log('getPosition error: ', e);
		});	

		var geocode = L.control.geocoder('search-3LVgAzp').addTo(map);

		var lc = L.control.locate({
			position: 'topleft',
		}).addTo(map);

		lc.start();

		// var locator = L.Mapzen.locator();
		// locator.setPosition('bottomright');
		// locator.addTo(map);

		$log.log('init map');
		return map;
	}

	// TODO: move into service? ***********************************
	vmMap.setRoute = function(destination) {
		// initializes a route from current position to supplied destination parameter
		locationService.getCurrentPosition().then(function(position) {
			console.log('getPosition result: ', position);
			return position.coords;
		}).then(function(coords) {
			return L.Routing.control({
			  	waypoints: [
			    	L.latLng(coords.latitude, coords.longitude),
			    	L.latLng(33.8128,-117.9259)
			  	],
			  	router: L.Routing.mapzen('valhalla-m9bds2x', {costing: 'auto'}),
			  	formatter: new L.Routing.mapzenFormatter(),
  				summaryTemplate:'<div class="start">{name}</div><div class="info {costing}">{distance}, {time}</div>',
  				routeWhileDragging: false
			}).addTo(map);	
		}).catch(function(e) {
			console.log('getPosition error: ', e);
		});
	}
}]);
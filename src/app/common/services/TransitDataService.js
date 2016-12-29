/**
* transitApp Module
*
* Description
* 
*/
angular.module('transitApp').factory('TransitDataService', ['$scope', '$http', 'LocationService', 'TransitLandRequestService', function($scope, $http, LocationService, TransitLandRequestService){
	function TransitDataService() {
		var self = this;
		this.locationService = new LocationService();
		this.transitService = new TransitLandRequestService();

		var currentLocation = this.locationService.getCurrentPosition().then(function(position) {
			self.coords = {
				lat: posision.coords.latitude,
				lon: position.coords.longitude
			}
		});
	};

	TransitDataService.prototype.getRoutes = function(location) {
		
		return self.transitService.routsByBbox(self.coords).then(function(response) {
			console.log('TransitDataService.getroutes: ', response)
		});
	};

	return TransitDataService;
}]);
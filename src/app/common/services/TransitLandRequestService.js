angular.module('transitApp').factory('TransitLandRequestService', ['$http', function($http) {
	function TransitLandRequestService() {};

	TransitLandRequestService.prototype.sendRequest = function(region) {
		var requestParams = {
			region: region,

		};
		var url = 'https://transit.land/api/v1/routes?operated_by='+
					   requestParams.region;

		var route = $http({
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
		return route;
	}	
	return TransitLandRequestService;
}]);

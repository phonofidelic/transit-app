angular.module('transitApp').factory('TransitLandRequestService', ['$http', function($http) {
	function TransitLandRequestService() {};

	TransitLandRequestService.prototype.http = function(state, metro) {
		var requestParams = {
			state: state,
			metro: metro
		};
		var baseUrl = 'http://transit.land/api/v1/?operators?'+
					   requestParams.state+;

		http({
			method: 'GET',
			url: url
		}).then(function(response) {
			console.log('transitland response: ', response);
		}).catch(function(e) {
			console.log('transitland error: ', e);
		});
	}	
	return TransitLandRequestService;
}]);

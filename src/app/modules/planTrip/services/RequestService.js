angular.module('transitApp').factory('RequestService', ['$http', function($http){
	function RequestService() {};
	RequestService.prototype.send = function(url) {
		$http({
			method: 'GET',
			url: url,
		}).then(function(response) {
			return response;
		}).catch(function(e) {
			console.log('RequestService.send error: ', e);
		});
	};
	return RequestService;
}])
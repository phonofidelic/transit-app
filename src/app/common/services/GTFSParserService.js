angular.module('transitApp').factory('GTFSParserService', ['$http', function($http){
	function GTFSParserService() {
		
	};

	// get transit data as text file and proccess response into a 2D array
	GTFSParserService.prototype.requestData = function(url) {
		return $http({
			method: 'GET',
			url: url
		}).then(function(response) {
			console.log('response: ', response);
			var rows = response.data.split('\n');
			// console.log('rows:', rows);
			
			cols =  [];

			rows.forEach(function(row) {
				cols.push(row.split(','));
			});
			// console.log('cols: ', cols);
			return cols;
		}).catch(function(e) {
			console.log('transitData error: ', e);
		});
	};

	return GTFSParserService;
}]);
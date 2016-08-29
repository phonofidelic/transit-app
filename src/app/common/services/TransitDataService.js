angular.module('transitApp').factory('TransitDataService', ['$http', function($http){
	function TransitDataService() {
		
	};

	// get transit data as text file and proccess response into a 2D array
	TransitDataService.prototype.requestData = function() {
		return $http({
			method: 'GET',
			url: 'http://localhost:3000/assets/transitData/stops.txt'
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

	return TransitDataService;
}]);
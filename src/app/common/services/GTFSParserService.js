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
			
			cols =  [];

			rows.forEach(function(row) {
				cols.push(row.split(','));
			});

			return cols;
		}).catch(function(e) {
			console.log('transitData error: ', e);
		});
	};

	GTFSParserService.prototype.toJSON = function(gtfsArray) {
		// Create an array to hold our json objects
		var json = [];
		var index = 0;

		// The first sub-array in gtfsArray contains the value keys
		for (var i = 1; i < gtfsArray.length; i ++) {
			var obj = {};
			json.push(obj);
		}

		// Create an array to hold the cell values from gtfsArray,
		// skip the array in gtfsArray containing key names
		// and extract cell values into exttractedVals array
		var extractedVals = [];		
		var values = gtfsArray.slice(1);		
		values.forEach(function(row) {
			for (var i = 0; i < row.length; i++) {
				extractedVals.push(row[i])
			}
		});

		// Assign key valye pairs to each object in json array
		json.forEach(function(item) {			
			gtfsArray[0].forEach(function(keyName) {
				var key = keyName;
				if (angular.isUndefined(extractedVals[index])) {
					extractedVals[i] = '';
				}
				item[key] = extractedVals[index];
				index++;
			});	
		});
		console.log('json: ', json);
		return json;		
	};

	return GTFSParserService;
}]);
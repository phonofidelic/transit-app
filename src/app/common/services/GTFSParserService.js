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

	GTFSParserService.prototype.toArrays = function(string) {
		var rows = string.split('\n');
		var cols = [];

		rows.forEach(function(row) {
			cols.push(row.split(','));
		});

		return cols;
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
		return json;		
	};

	GTFSParserService.prototype.groupBy = function(objArr, f) {
		//***************************
		// http://stackoverflow.com/questions/14592799/object-array-group-by-an-element/14593003
		//***************************
		// var sorted = {};

		// for (var i = 0; i < objArr.length; i++) {
		// 	var obj = objArr[i];
		// 	// console.log('obj: ', obj);

		// 	// if (sorted[obj.trip_id] === undefined) {
		// 		sorted[obj.trip_id] = [objArr[i]];
		// 	// }

		// 	// sorted[obj.trip_id].push(obj.trip_id);
		// }
		// console.log('sorted: ', sorted);



		/***************************
		// http://codereview.stackexchange.com/questions/37028/grouping-elements-in-array-by-multiple-properties

		function groupBy( array , f )
		{
		  var groups = {};
		  array.forEach( function( o )
		  {
		    var group = JSON.stringify( f(o) );
		    groups[group] = groups[group] || [];
		    groups[group].push( o );  
		  });
		  return Object.keys(groups).map( function( group )
		  {
		    return groups[group]; 
		  })
		}

		var result = groupBy(list, function(item)
		{
		  return [item.lastname, item.age];
		});
		*****************************/
		var groups = {};
		objArr.forEach(function(item) {
			var group = JSON.stringify(f(item));
			// console.log('group: ', group)
			groups[group] = groups[group] || [];
			groups[group].push(item);
		});
		console.log('groups: ', groups);
		return Object.keys(groups).map(function(group) {
			return groups[group];
		});
	};

	GTFSParserService.prototype.readZip = function(url, file) {
		var jsZip = new JSZip();
		return JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				console.log('JSZip error: ');	//reject()
				throw err;
			}
			jsZip.loadAsync(data).then(function(zip) {	//rsolve()
				console.log('success!: ', zip);
				// console.log('jsZip.file(): ', jsZip.file(file).async('string'));
				return jsZip.file(file).async("string");
				// return zip;
			})
			.then(function(string) {
				// console.log('zip string: ', string);
				return string;
			})
			.catch(function(err) {
				console.error('readZip error: ', err);
			});
		});
	};

	return GTFSParserService;
}]);
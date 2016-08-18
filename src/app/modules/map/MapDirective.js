angular.module('transitApp')
.directive('mapDirective', function() {
	return {
		templateUrl: 'app/modules/map/map.html',
		controller: 'MapController',
		controllerAs: 'vmMap'
	}
});
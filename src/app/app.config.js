angular.module('transitApp')
.config(['$routeProvider', '$locationProvider',
	function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'app/templates/planTrip.html',
				controller: 'PlanTripController',
				controllerAs: 'vm'
			});
		$locationProvider.html5Mode(true);
}]);

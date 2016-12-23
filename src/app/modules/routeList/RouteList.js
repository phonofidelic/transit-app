'use-strict';
angular.module('transitApp').controller('RoutListController', ['$scope', '$http', 'LocationService', 'TransitLandRequestService', 'TransitDataService', function($scope, $http, LocationService, TransitLandRequestService, TransitDataService) {
	var vm = this;
	var transitService = new TransitLandRequestService(),
		locationService = new LocationService();

	$scope.routes = [];
	vm.test = 'hello';

	function _checkScroll() {
		// *** set up scroll behavior for route list ***
		var secondItem = $('.routeButtonSecond');
		var firstItem = $('.routeButtonFirst');

		// if (secondItem.offset().top < firstItem.offset().top) {
		// 	// $('.notFirst').css('visibility', 'hidden');
		// }
		window.onscroll = function() {
			if (firstItem.offset().top >= secondItem.offset().top) {
				firstItem.removeClass('stuck');
			}

			if ($(document).scrollTop() + window.innerHeight < firstItem.offset().top + 50) {
				firstItem.addClass('stuck');
			}
		};
	};

}])
.directive('routeList', function() {
	return {
		temlate: './routeList.html'
	}
});
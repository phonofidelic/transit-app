'use-strict';
angular.module('transitApp').controller('PlanTripController', ['$scope', 'RequestService', function($scope, RequestService){
	var vm = this;
	var requestService = new RequestService();

	vm.sendRequest = function(input) {
		requestService.send(input);
	}
}]);
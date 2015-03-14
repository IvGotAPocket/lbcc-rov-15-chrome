var app = angular.module('WaterBearApp', [
	'ngRoute',
	'WaterBearApp.Controllers',
	'WaterBearApp.Directives',
	'WaterBearApp.Services'
]);


app.config(['$routeProvider', function ($routeProvider) {

	$routeProvider.

	when('/bridge', {
		templateUrl	: 'partials/bridge.html',
		controller	: ''
	}).

	when('/network', {
		templateUrl	: 'partials/network.html',
		controller	: ''
	}).

	when('/vehicle', {
		templateUrl	: 'partials/vehicle.html',
		controller	: ''
	}).

	when('/debug', {
		templateUrl	: 'partials/debug.html',
		controller	: ''
	}).

	otherwise({
		redirectTo	: '/bridge'
	});

}]);


app.factory('NavRoutes', function ($window) {
	return [
		{
			text: 'Bridge',
			page: '/bridge'
		},
		{
			text: 'Network',
			page: '/network'
		},
		{
			text: 'Vehicle',
			page: '/vehicle'
		},
		{
			text: 'Debug',
			page: '/debug'
		}
	];
});

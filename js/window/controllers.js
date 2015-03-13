var app = angular.module('WaterBearApp.Controllers', []);


app.controller('FramerateController', function (Framer, $scope) {
	Framer.register(function () { $scope.$apply(); });
	Framer.start();
});


app.controller('Nav', function ($scope, $location, NavRoutes, $window) {
	$scope.pages = NavRoutes;
	$scope.isActive = function (p) { return $location.url() == p.page; };
	$scope.goTo = function (p) { $location.url(p.page); };
	$scope.exit = function () { $window.close(); };
});


app.controller('StatusBar', function ($scope, GamepadManager, MathManager, VehicleManager) {
	$scope.gamepad = GamepadManager.gamepad;
});


app.controller('BridgeSelections', function ($scope, GamepadManager, VehicleManager) {

	$scope.gamepads = GamepadManager.gamepads;
	$scope.gamepad = GamepadManager.gamepad;
	$scope.gamepadOptions = {getterSetter:true};

	$scope.vehicles = VehicleManager.getVehicles;
	$scope.vehicle = VehicleManager.vehicle;
	$scope.vehicleOptions = {getterSetter:true};

	$scope.netStatus = function () {
		if (VehicleManager.isConnected()) return 3;
		if (VehicleManager.allowScan()) return 2;
		return 1;
	};

});


app.controller('NetworkSettings', function ($scope, VehicleManager) {
	$scope.ip = VehicleManager.broadcastIP;
	$scope.scan = VehicleManager.allowScan;
});


app.controller('ControllerInfo', function ($scope, GamepadManager) {
	$scope.gamepad = GamepadManager.gamepad;
});


app.controller('VectorTest', function ($scope, VehicleManager) {
	$scope.test = VehicleManager.vectorTest;
});
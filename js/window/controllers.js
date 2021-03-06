var app = angular.module('WaterBearApp.Controllers', []);


app.controller('FramerateController', function ($scope, Framer) {

	var scopeLast = -1;
	var scopeFramerate = 30;

	Framer.register(function () {
		var now = Date.now();
		if (now-scopeLast > 1000/scopeFramerate) {
			scopeLast = now;
			$scope.$apply();
		}
	});

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

	$scope.rovStatus = function () {
		if (VehicleManager.isConnected()) return 'Connected';
		if (VehicleManager.isLost()) return 'Lost';
		if (VehicleManager.allowScan()) return 'Searching';
		return 'Off';
	};

	$scope.isSend = VehicleManager.isSend;
	$scope.isRead = VehicleManager.isRead;
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
	$scope.ip			= VehicleManager.broadcastIP;
	$scope.scan			= VehicleManager.allowScan;
	$scope.poolEnabled	= VehicleManager.poolEnabled;
	$scope.poolFreq		= VehicleManager.poolFreq;
	$scope.getEnabled	= VehicleManager.getEnabled;
	$scope.getFreq		= VehicleManager.getFreq;
});


app.controller('ControllerInfo', function ($scope, GamepadManager) {
	$scope.gamepad = GamepadManager.gamepad;
});


app.controller('VehicleInfo', function ($scope, VehicleManager) {

	var d = 1;
	setTimeout(function () { d = 0; $scope.$apply(); }, 1);

	$scope.thrusters = VehicleManager.vehicle().thrusters;

	$scope.thrusterSnap = function (t) {
		return function (v) {
			if (angular.isDefined(v)) {
				v = parseInt(v);
				var mid = (t.n.minimum + t.n.maximum)/2;
				if (Math.abs(v-mid) < 50) return (t.n.updated = mid);
				return (t.n.updated = v);
			} else {
				return t.n.updated + d;
			}
		};
	};

	$scope.thruster = function (t) {
		return function (v) {
			return angular.isDefined(v) ? (t.n.updated = parseInt(v)) : t.n.updated;
		};
	};

});

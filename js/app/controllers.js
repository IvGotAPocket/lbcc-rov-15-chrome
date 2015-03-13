var app = angular.module('WaterBearApp.Controllers', []);


app.controller('Bridge', function ($scope, Framer, GamepadManager, VehicleManager) {

	$scope.gamepads = GamepadManager.gamepads;
	$scope.gamepad = GamepadManager.gamepad;
	$scope.gamepadOptions = {getterSetter:true};

	$scope.scanning = false;
	$scope.vehicles = VehicleManager.getVehicles;

	Framer.register(function () { $scope.$apply(); });
	Framer.start();

});


app.controller('ControllerInfo', function ($scope, GamepadManager) {

	$scope.gamepad = GamepadManager.gamepad;

});


app.controller('NetworkTest', function ($scope, VehicleManager) {

	$scope.ping = VehicleManager.ping;

});


app.controller('MathInfo', function ($scope, MathManager) {

	var M = [
		[ 1,-1,-1, 1, 0, 0, 0, 0 ],
		[ 1, 1,-1,-1, 0, 0, 0, 0 ],
		[ 0, 0, 0, 0, 1, 1, 1, 1 ],
		[ 0, 0, 0, 0,-1,-1, 1, 1 ],
		[ 0, 0, 0, 0,-1, 1,-1, 1 ],
		[ 2,-2, 2,-2, 0, 0, 0, 0 ]
	];

	var Y = [ 0, 1, 0, 0, 0, -2 ];

	$scope.send = function () {
		MathManager.sendVectorCommand({
			s	: 4,	// multiplier
			t	: 0.1,	// tolerance
			M	: M,	// motor matrix
			Y	: Y
		}, function (params) {
			console.log(params);
		});
	};

	$scope.ago = function () {
		var t = MathManager.getLastComm();
		if (t) return moment(t).fromNow();
		else return 'never';
	};

});

var app = angular.module('WaterBearApp.Services', []);


app.factory('Framer', ['$window', function ($window) {

	var tasks = [];

	function frame () {
		$window.setTimeout(function () {
			// Read values, do work, redraw at 60 FPS
			// requestAnimationFrame is a beautiful tool.
			requestAnimationFrame(frame);
		}, (1000/60));
		for (var i = 0; i < tasks.length; i++) tasks[i].call(this);
	}

	return {
		register	: function (task) { tasks.push(task); },
		start		: function () { setTimeout(frame,1); }
	};

}]);


app.factory('GamepadManager', ['$window', function ($window) {

	var gamepad = KeyboardGamepad();

	$window.addEventListener("gamepadconnected", onGamepadConnect, false);
	$window.addEventListener("gamepaddisconnected", onGamepadDisconnect, false);

	function getGamepads () {
		var gp = [];
		var ngp = navigator.getGamepads();
		gp.push(KeyboardGamepad());
		// I wish I didn't have to copy the array,
		// but getGamepads() has a weird quirk where
		// it is filled with empty list items.
		for (var i = 0; i < ngp.length; i++) {
			if (ngp[i] && ngp[i].connected) {
				gp.push(ngp[i]);
			}
		}
		return gp;
	}

	function onGamepadConnect (event) {
		if (getGamepads().length === 2) { gamepad = event.gamepad; }
	}

	function onGamepadDisconnect (event) {
		if (gamepad === event.gamepad) { gamepad = getGamepads()[0]; }
	}

	function getGamepad (gp) {
		return angular.isDefined(gp) ? (gamepad = gp) : gamepad;
	}

	return {
		gamepads: getGamepads,
		gamepad: getGamepad
	};

}]);


app.factory('MathManager', function ($window) {

	var iframe = null;
	var lastComm = 0;
	var _cb = null;

	$window.addEventListener('message', onMessage, false);

	function setFrame (element) {
		iframe = element;
	}

	function send (data) {
		if (!iframe) return console.error('missing iframe');
		iframe.contentWindow.postMessage(data, '*');
	}

	function sendVectorCommand (params, cb) {
		var data = {
			command	: 'vector',
			params	: params
		};
		_cb = cb;
		send(data);
	}

	function onVectorResult (params) {
		lastComm = Date.now();
		_cb(params);
		_cb = null;
	}

	function onMessage (event) {
		var data = event.data;
		if (data.math) {
			switch (data.command) {
				case 'pong': lastComm = Date.now(); break;
				case 'vectorResult': onVectorResult(data.params); break;
				default: console.error('Unknown command from math.js!');
			}
		} else {
			console.error('Unknown math.js message!');
			console.log(data);
		}
	}

	return {
		setFrame: setFrame,
		getLastComm: function () { return lastComm; },
		sendVectorCommand: sendVectorCommand
	};

});


app.factory('VehicleManager', function () {

	var broadcastAddress	= '192.168.0.255';
	var broadcastPort		= 21025;
	var vehicles			= [];

	var socketId;

	var Encoder = new TextEncoder();
	var Decoder = new TextDecoder();

	chrome.sockets.udp.create({}, function (socketInfo) {
		chrome.sockets.udp.onReceive.addListener(onReceive);
		chrome.sockets.udp.bind(socketInfo.socketId, "0.0.0.0", 0, function (result) {
			if (result < 0) {
				console.error("Error binding socket.");
			} else {
				socketId = socketInfo.socketId;
				console.log('Bound socket to port.');
			}
		});
	});

	var onReceive = function (info) {
		if (info.socketId !== socketId) { return; }
		var json = JSON.parse(Decoder.decode(info.data));
		switch (json.cmd) {
			case 'pong':
				onPong(info, json);
				break;
			default:
				console.error(info);
		}
	};

	function getVehicleByIp (ip) {
		for (var i = 0; i < vehicles.length; i++) {
			if (vehicles[i].ip == ip) { return vehicles[i]; }
		}
		return null;
	}

	function onPong (info, json) {
		var v = getVehicleByIp(info.remoteAddress);
		if (v) {
			v.lastComm = Date.now();
		} else {
			vehicles.push({
				ip			: info.remoteAddress,
				port		: info.remotePort,
				lastComm	: Date.now(),
				control		: json.ctl,
				channelCount: json.chn
			});
		}
	}

	// all values play against the motor matrix, so scale by 2
	// controller is naturally inverted == -Fy
	// user expects look right as right == -Tz
	// torque in z is double values == 2Tz
	function getAccelerationMatrix (t) {
		if (!$scope.gamepad()) return null;
		else navigator.getGamepads();
		t = t || 0.1; // 10%
		Fx = $scope.gamepad().axes[0];
		Fy = $scope.gamepad().axes[1];
		Tz = $scope.gamepad().axes[2];
		return [
			(Math.abs(Fx)<t) ? 0 : Fx*(2),
			(Math.abs(Fy)<t) ? 0 : Fy*(2)*(-1),
			0,
			0,
			0,
			(Math.abs(Tz)<t) ? 0 : Tz*(2)*(-1)*(2),
		];
	}

	function sendPacket () {
		var obj = {
			cmd:"ping",
			ctl:false
		};
		var buf = Encoder.encode(JSON.stringify(obj)).buffer;
		chrome.sockets.udp.send(socketId, buf, broadcastAddress, broadcastPort, function (sendInfo) {
			console.log("sent " + sendInfo.bytesSent);
		});
	}

	return {
		ping: sendPacket,
		getVehicles: function () { return vehicles; }
	};

});


var DEFAULT_MOTOR_MATRIX = [
	{
		motor	: 'bottomRight',
		strength: 0
	},
	{
		motor	: 'bottomLeft',
		strength: 0
	},
	{
		motor	: 'topLeft',
		strength: 0
	},
	{
		motor	: 'topRight',
		strength: 0
	},
	{
		motor	: 'bottomRightVertical',
		strength: 0
	},
	{
		motor	: 'bottomLeftVertical',
		strength: 0
	},
	{
		motor	: 'topLeftVertical',
		strength: 0
	},
	{
		motor	: 'topRightVertical',
		strength: 0
	}
];
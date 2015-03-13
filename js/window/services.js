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


app.factory('GamepadManager', function ($window, Framer) {

	var gamepad = KeyboardGamepad();

	$window.addEventListener("gamepadconnected", onGamepadConnect, false);
	$window.addEventListener("gamepaddisconnected", onGamepadDisconnect, false);

	Framer.register(function () { navigator.getGamepads(); });

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

});


app.factory('MathManager', function ($window) {

	var iframe = null;

	var lastComm = -1;	// Last received message from math.js

	var vectorCallback;	// Function to pass vector math results.

	/* ------------------------------------------------------------------------
		Event Listeners
	------------------------------------------------------------------------ */

	$window.addEventListener('message', onMessage, false);

	function onMessage (event) {
		var data = event.data;
		if (data.math) {
			switch (data.command) {
				case 'pong':
					lastComm = Date.now();
					break;
				case 'vectorResult':
					onVectorResult(data.params);
					break;
				default:
					console.error('Unknown command from math.js!');
			}
		} else {
			console.error('Unknown math.js message!');
			console.log(data);
		}
	}

	function onVectorResult (params) {
		lastComm = Date.now();
		vectorCallback(params);
	}

	/* ------------------------------------------------------------------------
		Local Functions
	------------------------------------------------------------------------ */

	// Send any command to math.js
	function send (data) {
		if (!iframe) return console.error('missing iframe');
		iframe.contentWindow.postMessage(data, '*');
	}

	// Send command to simply reply.
	function sendPingCommand () {
		var data = {
			command	: 'ping'
		};
		send(data);
	}

	// Send command to process vectors.
	function sendVectorCommand (params) {
		var data = {
			command	: 'vector',
			params	: params
		};
		send(data);
	}

	/* ------------------------------------------------------------------------
		Shared Functions
	------------------------------------------------------------------------ */

	// The vectormath directive calls this to save the iFrame.
	function setFrame (element) { iframe = element; }

	function setCallback (cb) { vectorCallback = cb; }

	function sendVectors (params) { sendVectorCommand(params); }

	return {
		setFrame	: setFrame,
		setCallback	: setCallback,
		sendVectors	: sendVectors
	};

});


app.factory('WaterBearVehicle', function () {

	var rov = {
		name			: 'WaterBear',
		version			: '2.0',
		comms: {
			ip				: '',
			port			: 0,
			lastComm		: -1,
			controlling		: true,
			channelCount	: 0,
		},
		thrusters		: [],
		servos			: [],
		thrustMatrix	: [],
	};

	createThruster(rov, 1, 500, 1500, 1,-1, 0, 1, 1, 0, 'bottomRight');
	createThruster(rov, 1, 500, 1500,-1,-1, 0,-1, 1, 0, 'bottomLeft');
	createThruster(rov, 1, 500, 1500,-1, 1, 0,-1,-1, 0, 'topLeft');
	createThruster(rov, 1, 500, 1500, 1, 1, 0, 1,-1, 0, 'topRight');
	createThruster(rov, 1, 500, 1500, 1,-1, 0, 0, 0, 1, 'bottomRightVert');
	createThruster(rov, 1, 500, 1500,-1,-1, 0, 0, 0, 1, 'bottomLeftVert');
	createThruster(rov, 1, 500, 1500,-1, 1, 0, 0, 0, 1, 'topLeftVert');
	createThruster(rov, 1, 500, 1500, 1, 1, 0, 0, 0, 1, 'topRightVert');

	computeThrustMatrix(rov);

	function createThruster (rov, chl, min, max, px, py, pz, fx, fy, fz, name) {
		rov.thrusters = rov.thrusters || [];
		rov.thrusters.push({
			name	: name,
			channel	: chl,
			'n'		: {
				minimum		: min,
				maximum		: max,
				current		: 0,
				updated		: 0,
				lastSent	: -1,
				lastRead	: -1
			},
			pos		: { x:px, y:py, z:pz },
			force	: { x:fx, y:fy, z:fz },
			torque	: { x:0,  y:0,  z:0 },
		});
	}

	function createServo (rov, chl, min, max, name) {
		rov.servos = rov.servos || [];
		rov.servos.push({
			name	: name,
			channel	: chl,
			'n'		: {
				minimum		: min,
				maximum		: max,
				current		: 0,
				updated		: 0,
				lastSent	: -1,
				lastRead	: -1
			}
		});
	}

	function computeThrustMatrix (rov) {
		rov.thrustMatrix = [[],[],[],[],[],[]];
		for (var i = 0; i < rov.thrusters.length; i++) {
			var p = rov.thrusters[i].pos;
			var f = rov.thrusters[i].force;
			var t = rov.thrusters[i].torque;
			t.x = p.y*f.z - p.z*f.y;
			t.y = p.z*f.x - p.x*f.z;
			t.z = p.x*f.y - p.y*f.x;
			rov.thrustMatrix[0].push(f.x);
			rov.thrustMatrix[1].push(f.y);
			rov.thrustMatrix[2].push(f.z);
			rov.thrustMatrix[3].push(t.x);
			rov.thrustMatrix[4].push(t.y);
			rov.thrustMatrix[5].push(t.z);
		}
	}

	return rov;
});


app.factory('VehicleManager', function (Framer, GamepadManager, MathManager, WaterBearVehicle) {

	var _broadcastAddress	= '192.168.0.255';
	var _broadcastPort		= 21025;
	var vehicles			= [];
	var vehicle				= null;
	var scanning			= false;

	var vectorFrequency		= 10;	// Perform vector math 10 times a second
	var poolingFrequency	= 10;	// Accumulate changes before sending a batch
	var scanFrequency		= 0.2;	// How many times a second to broadcast ping

	var socketId;

	var Encoder = new TextEncoder();
	var Decoder = new TextDecoder();

	/* ------------------------------------------------------------------------
		Event Listeners
	------------------------------------------------------------------------ */

	// Call this method when math.js is done working.
	MathManager.setCallback(onVectorResult);

	// Open the socket and bind for two way communication.
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

	/* ------------------------------------------------------------------------
		Local Functions - Vehicle Comms
	------------------------------------------------------------------------ */

	function getVehicleByIp (ip) {
		for (var i = 0; i < vehicles.length; i++) {
			if (vehicles[i].ip == ip) { return vehicles[i]; }
		}
		return null;
	}

	function broadcastAddress (ip) {
		return angular.isDefined(ip) ? (_broadcastAddress = ip) : _broadcastAddress;
	}



	function isConnected () {
		return false;
	}

	function onReceive (info) {
		if (info.socketId !== socketId) { return; }
		var json = JSON.parse(Decoder.decode(info.data));
		switch (json.cmd) {
			case 'pong':
				onPong(info, json);
				break;
			default:
				console.error(info);
		}
	}

	function onPong (info, json) {
		var v = getVehicleByIp(info.remoteAddress);
		if (v) {
			v.comms.lastComm = Date.now();
		} else {
			var rov = WaterBearVehicle;
			if (rov.version != json.vrs) throw Error('version mismatch');
			rov.comms.ip		= info.remoteAddress;
			rov.comms.port		= info.remotePort;
			rov.comms.lastComm	= Date.now();
			rov.controlling		= json.ctl;
			rov.channelCount	= json.chn;
			vehicles.push(rov);
		}
	}

	function sendPacket () {
		var obj = {
			cmd	: "ping",
			ctl	: false
		};
		var buf = Encoder.encode(JSON.stringify(obj)).buffer;
		chrome.sockets.udp.send(socketId, buf, _broadcastAddress, _broadcastPort, function (sendInfo) {
			console.log("sent " + sendInfo.bytesSent);
		});
	}

	/* ------------------------------------------------------------------------
		Local Functions - Gamepad Transformations
	------------------------------------------------------------------------ */

	function onVectorResult (params) {
		if (!vehicle) throw new Error('no vehicle');
		console.log(params);
		// update the values on the TO-SEND vehicle copy
	}

	// all values play against the motor matrix, so scale by 2
	// controller is naturally inverted == -Fy
	// user expects look right as right == -Tz
	// torque in z is double values == 2Tz
	function getAccelerationMatrix (t) {
		if (!vehicle) throw new Error('no vehicle');
		if (!GamepadManager.gamepad()) throw new Error('no gamepad');
		navigator.getGamepads();
		Fx = GamepadManager.gamepad().axes[0];
		Fy = GamepadManager.gamepad().axes[1];
		Fz = GamepadManager.gamepad().buttons[7].value - GamepadManager.gamepad().buttons[6].value;
		Tz = GamepadManager.gamepad().axes[2];
		return [
			(Math.abs(Fx)<t) ? 0 : Fx*(2),
			(Math.abs(Fy)<t) ? 0 : Fy*(2)*(-1),
			(Math.abs(Fz)<t) ? 0 : Fz*(2),
			0,
			0,
			(Math.abs(Tz)<t) ? 0 : Tz*(2)*(-1)*(2),
		];
	}

	function computeVectors () {
		MathManager.sendVectors({
			M	: vehicle.thrustMatrix,
			Y	: getAccelerationMatrix(0.1)
		});
	}

	/* ------------------------------------------------------------------------
		Shared Functions
	------------------------------------------------------------------------ */

	return {
		getVehicles	: function ( ) { return vehicles; },
		allowScan	: function (b) { return angular.isDefined(b) ? (scanning = b) : scanning; },
		vehicle		: function (v) { return angular.isDefined(v) ? (vehicle = v) : vehicle; },
		isConnected	: function ( ) { return isConnected(); },
		broadcastIP	: broadcastAddress,
		vectorTest	: function ( ) {
			vehicle = WaterBearVehicle;
			computeVectors();
		}
	};

});






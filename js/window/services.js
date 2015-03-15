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
			connected		: false
		},
		thrusters		: [],
		servos			: [],
		thrustMatrix	: []
	};

	createThruster(rov, 1, 1000, 2000, 1,-1, 0, 1, 1, 0, 'bottomRight');
	createThruster(rov, 1, 1000, 2000,-1,-1, 0,-1, 1, 0, 'bottomLeft');
	createThruster(rov, 1, 1000, 2000,-1, 1, 0,-1,-1, 0, 'topLeft');
	createThruster(rov, 1, 1000, 2000, 1, 1, 0, 1,-1, 0, 'topRight');
	createThruster(rov, 1, 1000, 2000, 1,-1, 0, 0, 0, 1, 'bottomRightVert');
	createThruster(rov, 1, 1000, 2000,-1,-1, 0, 0, 0, 1, 'bottomLeftVert');
	createThruster(rov, 1, 1000, 2000,-1, 1, 0, 0, 0, 1, 'topLeftVert');
	createThruster(rov, 1, 1000, 2000, 1, 1, 0, 0, 0, 1, 'topRightVert');

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

	var socketId;

	var debugging			= false; // Warning: This makes my computer cry.

	var Encoder				= new TextEncoder();
	var Decoder				= new TextDecoder();

	var _broadcastAddress	= '192.168.0.255';
	var _broadcastPort		= 21025;
	var vehicles			= [];
	var vehicle				= null;

	// How many times a second to expect a message from an ROV.
	var lostFrequency		= 0.5;

	// Broadcast a PING packet to find and keep ROVs.
	var scanning			= false;
	var scanFrequency		= 0.6;
	var lastScan			= -1;

	// Read gamepad values and perform vector math, saving to current ROV.
	var collecting			= false;
	var vectorFrequency		= 10;
	var lastVectors			= -1;

	// Collect "updated" values and send them to the ROVs.
	var pooling				= false;	// on/off
	var poolingFrequency	= 10;		// Hz
	var lastPooling			= -1;		// ms

	// Find "current" values that are old and make GET requests.
	var getting				= false;	// on/off
	var gettingFrequency	= 10;		// Hz
	var gettingLastTime		= -1;		// ms
	var gettingMaxAge		= 500;		// ms

	var audioEnabled		= true;
	var audio_found			= new Audio('media/171670__fins__success-2.wav');
	var audio_unlost		= new Audio('media/171671__fins__success-1.wav');
	var audio_lost			= new Audio('media/204369__philitup321__alert-sound.ogg');

	var globalLastSend		= -1;
	var globalLastRead		= -1;

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
		Local Functions - Time-based
	------------------------------------------------------------------------ */

	Framer.register(onFrame);

	function onFrame () {

		var now = Date.now(), i, rov;

		// Scanning: send broadcast packet every so often, if enabled.
		if (scanning) {
			if ((now - lastScan) >= 1000 / scanFrequency) {
				lastScan = now;
				sendPingCommand();
			}
		}

		// Audio cues: play sounds when ROVs change lost status, if enabled.
		if (audioEnabled) {
			for (i = 0; i < vehicles.length; i++) {
				rov = vehicles[i];
				var lost = (now - rov.comms.lastComm >= 1000 / lostFrequency);
				if (rov.comms.connected != lost) {
					rov.comms.connected = !!lost;
					if (lost) audio_lost.play();
					else audio_unlost.play();
				}
			}
		}

		// Collection: get gamepad state and perform math, if enabled.
		// todo

		// Pooling: read local updated values and send them to ROVs, if enabled.
		if (pooling) {
			if ((now - lastPooling) >= 1000 / poolingFrequency) {
				lastPooling = now;
				for (i = 0; i < vehicles.length; i++) {
					rov = vehicles[i];
					var list = buildUpdate(rov);
					if (list.length > 0) {
						if (debugging) console.log('Sending an update to ' + list.length + ' channels.');
						sendPacket({
							"cmd"	: "set",
							"list"	: list
						}, rov.comms.ip, rov.comms.port);
					}
				}
			}
		}

		// Getting: look for old values and request new data
		if (getting) {
			if ((now - gettingLastTime) >= 1000 / gettingFrequency) {
				gettingLastTime = now;
				for (i = 0; i < vehicles.length; i++) {
					rov = vehicles[i];
					var old = hasOldCurrentValues(rov, gettingMaxAge);
					if (old) {
						if (debugging) console.log('Sending an GET due to old values.');
						sendPacket({"cmd":"get"}, rov.comms.ip, rov.comms.port);
					}
				}
			}
		}

		//console.log('Vehicle frame took: ' + (Date.now() - now));
	}

	/* ------------------------------------------------------------------------
		Local Functions - Vehicle Info
	------------------------------------------------------------------------ */

	function getVehicleByIp (ip) {
		for (var i = 0; i < vehicles.length; i++) {
			if (vehicles[i].comms.ip == ip) { return vehicles[i]; }
		}
		return null;
	}

	// Returns true if the vehicle is chosen and communicating
	function isConnected () {
		return (!!vehicle) && (Date.now() - vehicle.comms.lastComm < 1000 / lostFrequency);
	}

	// Returns true if the vehicle is chosen and is lost.
	function isLost () {
		return (!!vehicle) && (Date.now() - vehicle.comms.lastComm >= 1000 / lostFrequency);
	}

	function buildUpdate (rov) {
		var list = [], now = Date.now(), i;
		// First do thrusters
		for (i = 0; i < rov.thrusters.length; i++) {
			var thruster = rov.thrusters[i];
			if (thruster.n.updated !== thruster.n.current) {
				thruster.n.lastSent = now;
				list.push({
					'c': thruster.channel,
					'v': thruster.n.updated
				});
			}
		}
		// then servos
		for (i = 0; i < rov.servos.length; i++) {
			servos = rov.servos[i];
			if (servos.n.updated !== servos.n.current) {
				servos.n.lastSent = now;
				list.push({
					'c': servos.channel,
					'v': servos.n.updated
				});
			}
		}
		return list;
	}

	function hasOldCurrentValues (rov, timeout) {
		var now = Date.now(), i, age;
		// First do thrusters
		for (i = 0; i < rov.thrusters.length; i++) {
			var thruster = rov.thrusters[i];
			age = now - thruster.n.lastRead;
			if (age > timeout) { return true; }
		}
		// then servos
		for (i = 0; i < rov.servos.length; i++) {
			var servos = rov.servos[i];
			age = now - servos.n.lastRead;
			if (age > timeout) { return true; }
		}
		return false;
	}

	/* ------------------------------------------------------------------------
		Local Functions - Vehicle Comms
	------------------------------------------------------------------------ */

	function sendPingCommand () {
		if (debugging) console.log('Pinging network...');
		sendPacket({
			cmd	: "ping",
			ctl	: false
		}, _broadcastAddress, _broadcastPort);
	}

	function onReceive (info) {
		if (info.socketId !== socketId) { return; }
		globalLastRead = Date.now();
		var json = JSON.parse(Decoder.decode(info.data));
		switch (json.cmd) {
			case 'pong':
				onPong(info, json);
				break;
			case 'is':
				onIs(info, json);
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
			audio_found.play();
			if (!vehicle) vehicle = rov;
		}
	}

	function onIs (info, json) {
		var rov = getVehicleByIp(info.remoteAddress);
		if (!rov) { throw new Error('is command from unknown'); }
		var now = rov.comms.lastComm = Date.now();
		for (var i = 0; i < json.list.length; i++) {
			var c = json.list[i].c;
			var v = json.list[i].v;
			var k = false;
			for (var j = 0; j < rov.thrusters.length; j++) {
				if (rov.thrusters[j].channel === c) {
					rov.thrusters[j].n.current = v;
					rov.thrusters[j].n.updated = rov.thrusters[j].n.updated || v;
					rov.thrusters[j].n.lastRead = now;
					k = true;
					if (debugging) console.log('Read thruster channel ' + c + ' as ' + v);
					break;
				}
			}
			for (var j2 = 0; j2 < rov.servos.length; j2++) {
				if (rov.servos[j2].channel === c) {
					rov.servos[j2].n.current = v;
					rov.servos[j2].n.lastRead = now;
					k = true;
					if (debugging) console.log('Read servo channel ' + c + ' as ' + v);
					break;
				}
			}
			if (!k) console.error('Unknown channel ' + c + ' and value ' + v);
		}
	}

	function sendPacket (data, ip, port) {
		var buf = Encoder.encode(JSON.stringify(data)).buffer;
		chrome.sockets.udp.send(socketId, buf, ip, port, function (sendInfo) {
			if (debugging) console.log("Sent " + sendInfo.bytesSent + " bytes.");
			globalLastSend = Date.now();
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
		vehicle		: function (v) { return angular.isDefined(v) ? (vehicle = v) : vehicle; },
		isConnected	: isConnected,
		isLost		: isLost,
		allowScan	: function (v) { return angular.isDefined(v) ? (scanning = v) : scanning; },
		broadcastIP	: function (v) { return angular.isDefined(v) ? (_broadcastAddress = v) : _broadcastAddress; },
		poolEnabled	: function (v) { return angular.isDefined(v) ? (pooling = v) : pooling; },
		poolFreq	: function (v) { return angular.isDefined(v) ? (poolingFrequency = v) : poolingFrequency; },
		getEnabled	: function (v) { return angular.isDefined(v) ? (getting = v) : getting; },
		getFreq		: function (v) { return angular.isDefined(v) ? (gettingFrequency = v) : gettingFrequency; },
		isSend		: function ( ) { return (Date.now() - globalLastSend < 100); },
		isRead		: function ( ) { return (Date.now() - globalLastRead < 100); }
	};

});






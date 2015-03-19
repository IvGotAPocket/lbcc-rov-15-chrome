var socketId;

var Encoder				= new TextEncoder();
var Decoder				= new TextDecoder();


// Open the socket and bind for two way communication.
chrome.sockets.udp.create({}, function (socketInfo) {
	chrome.sockets.udp.onReceive.addListener(onReceive);
	chrome.sockets.udp.bind(socketInfo.socketId, "0.0.0.0", 21025, function (result) {
		if (result < 0) {
			console.error("Error binding socket.");
		} else {
			socketId = socketInfo.socketId;
			console.log('Bound socket to port.');
		}
	});
});


function onReceive (info) {
	if (info.socketId !== socketId) { return; }
	globalLastRead = Date.now();
	var json = JSON.parse(Decoder.decode(info.data));
	switch (json.cmd) {
		case 'ping':
			onPing(info, json);
			break;
		case 'get':
			onGet(info, json);
			break;
		case 'set':
			onSet(info, json);
			break;
		default:
			console.error(info);
	}
}


function sendPacket (data, ip, port) {
	var buf = Encoder.encode(JSON.stringify(data)).buffer;
	chrome.sockets.udp.send(socketId, buf, ip, port, function (sendInfo) { });
}


function onPing (info, json) {
	var response = {
		'cmd'	: 'pong',
		'name'	: 'DummyBear',
		'vrs'	: '2.1',
		'ctl'	: true,
		'chn'	: 16
	};
	sendPacket(response, info.remoteAddress, info.remotePort);
}





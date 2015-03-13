chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('window.html', {
		'bounds': {
			'width': 500,
			'height': 500
		},
		//minWidth: 500,
    	//minHeight: 900,
    	//frame: 'none'
	}, function (window) {
		//window.maximize();
	});
});

// "permissions": ["system.network"]
chrome.system.network.getNetworkInterfaces(function (interfaces) {
	console.log(interfaces);
});

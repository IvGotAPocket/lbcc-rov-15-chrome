(function (window) {

	window.addEventListener('keydown', onKeyDown, false);
	window.addEventListener('keyup', onKeyUp, false);

	window.KeyboardGamepad = function () { return gp; };

	var gp = {
		index	: 99,
		id		: 'WASD IJKL Keyboard',
		axes	: [0,0,0,0],
		buttons	: [
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false },
			{ pressed: false }
		]
	};

	function onKeyDown(event) {
		switch (event.keyCode) {
			// WASD
			case 65: gp.axes[0] = -1; break; // A
			case 68: gp.axes[0] =  1; break; // D
			case 87: gp.axes[1] = -1; break; // W
			case 83: gp.axes[1] =  1; break; // S
			// Arrow Keys
			case 74: gp.axes[2] = -1; break; // Left
			case 76: gp.axes[2] =  1; break; // Right
			case 73: gp.axes[3] = -1; break; // Up
			case 75: gp.axes[3] =  1; break; // Down
		}
	}

	function onKeyUp(event) {
		switch (event.keyCode) {
			// WASD
			case 65: gp.axes[0] = 0; break; // A
			case 68: gp.axes[0] = 0; break; // D
			case 87: gp.axes[1] = 0; break; // W
			case 83: gp.axes[1] = 0; break; // S
			// Arrow Keys
			case 74: gp.axes[2] = 0; break; // Left
			case 76: gp.axes[2] = 0; break; // Right
			case 73: gp.axes[3] = 0; break; // Up
			case 75: gp.axes[3] = 0; break; // Down
		}
	}

}).call(this, window);

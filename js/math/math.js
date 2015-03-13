window.addEventListener('message', function (event) {
    var data = event.data;
    switch (data.command) {
    	case 'ping':
    		event.source.postMessage({
    			math	: true,
    			command	: 'pong'
    		}, event.origin);
    		break;
    	case 'vector':
    		var results = computeVectors(data.params);
    		event.source.postMessage({
    			math	: true,
    			command	: 'vectorResult',
    			params	: results
    		}, event.origin);
    		break;
    	default:
    		console.error('Math.js received unknown command!');
    }
});

function computeVectors (params) {
	var n = numeric;
	var Y = params.Y;
	var M = params.M;
	var X;
	var start = Date.now();

	try {
		// Least squares solution, performed stepwise.
		// http://people.csail.mit.edu/bkph/articles/Pseudo_Inverse.pdf
		var T = n.transpose(M);
		var D = n.dot(M,T);
		var I = n.inv(D);
		var F = n.dot(T,I);
		X = n.dot(F,Y);
	} catch (e) {
		return {
			error	: e,
			time	: Date.now() - start
		};
	}

	return {
		error	: false,
		time	: Date.now() - start,
		X		: X
	};
}

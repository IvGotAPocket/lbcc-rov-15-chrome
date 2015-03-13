var app = angular.module('WaterBearApp.Directives', []);


app.directive("vectormath", function (MathManager) {
	return {
		restrict: "A", // apply where matching attribute name only
		link: function ($scope, element) {
			MathManager.setFrame(element[0]);
		}
	};
});


app.directive("leftstick", function (Framer) {
	return {
		restrict: "A",
		link: function ($scope, element) {
			var w = element[0].width = 36;
			var h = element[0].height = 36;
			function update () {
				if (!$scope.gamepad()) return;
				if (typeof($scope.gamepad().axes[0]) !== 'number') return;
				element[0].width = element[0].width;
				var ctx = element[0].getContext('2d');
				ctx.beginPath();
				ctx.arc(w/2,h/2,w/2,0,2*Math.PI);
				ctx.stroke();
				ctx.beginPath();
				var x = w/2 * (1 + $scope.gamepad().axes[0]);
				var y = h/2 * (1 + $scope.gamepad().axes[1]);
				ctx.arc(x,y,2,0,2*Math.PI);
				ctx.stroke();
			}
			Framer.register(update);
		}
	};
});


app.directive("rightstick", function (Framer) {
	return {
		restrict: "A",
		link: function ($scope, element) {
			var w = element[0].width = 36;
			var h = element[0].height = 36;
			function update () {
				if (!$scope.gamepad()) return;
				if (typeof($scope.gamepad().axes[2]) !== 'number') return;
				element[0].width = element[0].width;
				var ctx = element[0].getContext('2d');
				ctx.beginPath();
				ctx.arc(w/2,h/2,w/2,0,2*Math.PI);
				ctx.stroke();
				ctx.beginPath();
				var x = w/2 * (1 + $scope.gamepad().axes[2]);
				var y = h/2 * (1 + $scope.gamepad().axes[3]);
				ctx.arc(x,y,2,0,2*Math.PI);
				ctx.stroke();
			}
			Framer.register(update);
		}
	};
});


app.directive("rearleftstick", function (Framer) {
	return {
		restrict: "A",
		link: function ($scope, element) {
			var w = element[0].width = 36;
			var h = element[0].height = 36;
			function update () {
				if (!$scope.gamepad()) return;
				element[0].width = element[0].width;
				var ctx = element[0].getContext('2d');
				ctx.beginPath();
				ctx.rect(w/4,0,w/2,h);
				ctx.stroke();
				ctx.beginPath();
				var y = h * (1 - $scope.gamepad().buttons[6].value);
				ctx.arc(w/2,y,2,0,2*Math.PI);
				ctx.stroke();
			}
			Framer.register(update);
		}
	};
});


app.directive("rearrightstick", function (Framer) {
	return {
		restrict: "A",
		link: function ($scope, element) {
			var w = element[0].width = 36;
			var h = element[0].height = 36;
			function update () {
				if (!$scope.gamepad()) return;
				element[0].width = element[0].width;
				var ctx = element[0].getContext('2d');
				ctx.beginPath();
				ctx.rect(w/4,0,w/2,h);
				ctx.stroke();
				ctx.beginPath();
				var y = h * (1 - $scope.gamepad().buttons[7].value);
				ctx.arc(w/2,y,2,0,2*Math.PI);
				ctx.stroke();
			}
			Framer.register(update);
		}
	};
});


app.directive("forcediagram", function (Framer) {

	function arrow (ctx,p1,p2,size) {
    	ctx.save();

    	// Rotate the context to point along the path
    	var dx = p2.x-p1.x, dy=p2.y-p1.y, len=Math.sqrt(dx*dx+dy*dy);
    	ctx.translate(p2.x,p2.y);
    	ctx.rotate(Math.atan2(dy,dx));

    	// line
    	ctx.lineCap = 'round';
    	ctx.beginPath();
    	ctx.moveTo(0,0);
    	ctx.lineTo(-len,0);
    	ctx.closePath();
    	ctx.stroke();

    	// arrowhead
    	ctx.beginPath();
    	ctx.moveTo(0,0);
    	ctx.lineTo(-size,-size);
    	ctx.lineTo(-size, size);
    	ctx.closePath();
    	ctx.fill();

    	ctx.restore();
    }

	return {
		restrict: "A",
		link: function ($scope, element) {

			var w = element[0].width = 64;
			var h = element[0].height = 64;

			function update () {
				if (!$scope.gamepad()) return;
				element[0].width = element[0].width;
				var ctx = element[0].getContext('2d');

				ctx.beginPath();
				ctx.rect(w/4,h/4,w/2,h/2);
				ctx.stroke();
				ctx.fillStyle = '#DDDDDD';
				ctx.fill();

				var x = w/2*(1+$scope.gamepad().axes[0]);
				var y = h/2*(1+$scope.gamepad().axes[1]);
				ctx.lineWidth = 2;
				ctx.strokeStyle = ctx.fillStyle = 'RED';
				arrow(ctx,{x:w/2,y:h/2},{x:x,y:y},4);


				x = w/2*(0.75);
				y = h/2*(1+$scope.gamepad().buttons[6].value);
				ctx.lineWidth = 2;
				ctx.strokeStyle = ctx.fillStyle = 'GREEN';
				arrow(ctx,{x:x,y:h/2},{x:x,y:y},4);

				x = w/2*(1.25);
				y = h/2*(1-$scope.gamepad().buttons[7].value);
				ctx.lineWidth = 2;
				ctx.strokeStyle = ctx.fillStyle = 'GREEN';
				arrow(ctx,{x:x,y:h/2},{x:x,y:y},4);


				ctx.save();

				var s = 2*Math.PI*$scope.gamepad().axes[2];
				var n = -Math.PI/2;
				var r = 24;
				ctx.lineWidth = 1;
				ctx.strokeStyle = ctx.fillStyle = 'BLUE';

				ctx.beginPath();
				if (s>0) ctx.arc(w/2,h/2,r,0+n,s+n);
				else ctx.arc(w/2,h/2,r,s+n,0+n);
				ctx.stroke();

				var arcx = r*Math.cos(s+n)+w/2;
				var arcy = r*Math.sin(s+n)+h/2;
				ctx.translate(arcx,arcy);
				ctx.rotate(s+n);

				if (s < 0) {
					ctx.beginPath();
					ctx.moveTo(0,0);
					ctx.lineTo( 4, 4);
					ctx.lineTo(-4, 4);
					ctx.closePath();
					ctx.fill();
				} else {
					ctx.beginPath();
					ctx.moveTo(0,0);
					ctx.lineTo( 4,-4);
					ctx.lineTo(-4,-4);
					ctx.closePath();
					ctx.fill();
				}

				ctx.restore();

			}

			Framer.register(update);
		}
	};
});

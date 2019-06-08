var Vector = function(x, y) {
	this.x = x;
	this.y = y;
	this.length = Math.hypot(this.x, this.y);
};
Vector.prototype.sum = function(v2) {
	return new Vector(
		this.x + v2.x, 
		this.y + v2.y
	);
};
Vector.prototype.minus = function(v2) {
	return new Vector(
		this.x - v2.x, 
		this.y - v2.y
	);
};
Vector.prototype.multiply = function(num) {
	return new Vector(
		this.x * num, 
		this.y * num
	);
};
Vector.prototype.divide = function(num) {
	num = Number(num);
	if(num !== 0) {
		return new Vector(
			this.x / num, 
			this.y / num
		);
	}
	return null;
};
Vector.prototype.normalize = function() {
	return this.divide(this.length);
};
Vector.prototype.leftHand = function() {
	return new Vector(
		this.y,
		-this.x
	);
};
Vector.prototype.rightHand = function() {
	return new Vector(
		-this.y,
		this.x
	);
};
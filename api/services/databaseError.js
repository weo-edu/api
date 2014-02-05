var util = require('util');

var NotFound = exports.NotFound = function(message) {
	Error.call(this);
	this.message = message;
};

util.inherits(NotFound, Error);
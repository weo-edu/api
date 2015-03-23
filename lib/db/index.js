var monk = require('monk');
var config = require('config');

module.exports = monk(config.mongo);
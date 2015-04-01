require('babel/register');

var debug = require('debug')('weo:pre-boot');
module.exports = require('lib/boot');
debug('finish boot');
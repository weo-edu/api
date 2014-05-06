var io = require('socket.io-client');
require('lib/router.io-cli')(io.Socket.prototype);
module.exports = io;

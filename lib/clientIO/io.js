var io = require('socket.io-client');
require('lib/router.io-client')(io.Socket.prototype);
module.exports = io;

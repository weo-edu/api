/**
 * Bootstrap
 *
 * An asynchronous boostrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */

// Clean up stack traces by removing node-core methods
//require('clarify');

var passport = require('passport'),
		http = require('http'),
    methods = ['login', 'logIn', 'logout', 'logOut', 'isAuthenticated', 'isUnauthenticated'];

module.exports.bootstrap = function (cb) {
  browserifyModels();
  controllerRoutes(sails);

  sails.on('router:route', function(data) {
  	if (!data.res.setHeader) {
  		var res = data.res;
      res.setHeader = res.header;
      res.write = function(str) {
      	this._data = this._data || '';
      	this._data += str;
      }
      res.end = function(data) {
      	if (data) this.write(data);
        this.send(JSON.stringify(this._data));
      }
    }
  });

  sails.on('router:route', function(data) {
  	var token = data.req.socket && data.req.socket.handshake && data.req.socket.handshake.query.token;
  	if (token) {
  		data.req.headers.authorization = 'Bearer ' + token;
  	}
  });

  var passportInitialize = passport.initialize();
  sails.on('router:route', function(data) {
  	var req = data.req;
  	for (var i = 0; i < methods.length; i++) {
      req[methods[i]] = http.IncomingMessage.prototype[methods[i]];
    }
    passportInitialize(data.req, data.res, function(){});
  });

  sails.emit('bootstrap');
  // It's very important to trigger this callack method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
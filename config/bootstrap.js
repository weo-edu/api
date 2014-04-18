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
var passport = require('passport');
var http = require('http');
var methods = ['login', 'logIn', 'logout', 'logOut', 'isAuthenticated', 'isUnauthenticated'];

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

  // Retrieve an access_token from a request.  It can be in the
  // authorization header, the query params, or the request body
  function getToken(req) {
    var token;
    if(req.headers && req.headers.authorization) {
      var parts = req.headers.authorization.split(' ');
      if(parts[0] === 'Bearer')
        return parts[1];
    }

    if(req.body && req.body.access_token)
      return req.body.access_token;
    if(req.query && req.query.access_token)
      return req.query.access_token;
  }

  sails.on('router:route', function(data) {
    if(data.req.socket && data.req.socket.handshake) {
      // For socket requests, get the token from the initial http
      // handshake req
      data.req.query.access_token = getToken(data.req.socket.handshake);
    }

    // Put the token on the request in a uniformly accessible way
    // so that we can use it in controllers
    data.req.access_token = getToken(data.req);
  });

  // Setup passport middleware and methods on socket requestss
  var passportInitialize = passport.initialize();
  sails.on('router:route', function(data) {
    for (var i = 0; i < methods.length; i++) {
      data.req[methods[i]] = http.IncomingMessage.prototype[methods[i]];
    }
    passportInitialize(data.req, data.res, function(){});
  });

  sails.emit('bootstrap');
  // It's very important to trigger this callack method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
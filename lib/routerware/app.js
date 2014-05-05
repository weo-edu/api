var ware = require('ware');
var EventEmitter = require('events').EventEmitter;
var url = require('url');
var _ = require('lodash');


var proto = {};

module.exports = function() {
  function app(req, res, next) {
    app.handle(req, res, next);
  }
  _.extend(app, proto);
  _.extend(app, EventEmitter.prototype);
  app.init();
  return app;
}

proto.init = function() {
  this.middleware = ware();
  this.route = '/';
  this.parent = null;
  this.settings = {};

  this.on('mount', function(parent) {
    this.settings.__proto__ = parent.settings;
  });

  this.middleware.use(function(req, res, next) {
    if (!req.path)
      req.path = url.parse(req.url).pathname;
    next();
  });
}

proto.use = function(route, fn) {
  if ('string' != typeof route) {
    fn = route;
    route = '/';
  }

  // strip trailing slash
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  var self = this;
  this.middleware.use(function(req, res, next) {
    var path = req.path;

    if (path === undefined) path = '/';

    // check if route matches
    if (0 != path.toLowerCase().indexOf(route.toLowerCase()))
      return next();

    // check for trailing slash
    var c = path[route.length];
    if (c && '/' != c && '.' != c) 
      return next();
    
    // Trim off the part of the url that matches the route
    req.path = req.path.substr(route.length);

    fn(req, res, next);

  });

  // mount an app
  if (fn.handle && fn.set) {
    fn.parent = this;
    fn.emit('mount', this);
  }
}

proto.handle = function(req, res, done) {
  this.middleware.run(req, res, function(err) {
    done(err);
  });
};

proto.set = function(setting, val){
  if (1 == arguments.length) {
    return this.settings[setting];
  } else {
    this.settings[setting] = val;
    return this;
  }
};

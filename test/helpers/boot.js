var sails = require('sails')
  , supertest = require('supertest')
  , chai = require('chai')
  , _ = require('lodash')
  , socket = require('socket.io-client')
  , querystring = require('querystring');

chai.use(require('./chai'));
chai.use(require('chai-properties'));
chai.use(require('chai-fuzzy'));
chai.use(require('chai-http'));
chai.use(require('chai-things'));

global._ = _;
global.expect = chai.expect;

// Use a different port for API tests, so that api tests
// can be run without killing any other servers that might
// be running
process.env.PORT = 1339;

before(function(done) {
  this.timeout(4000);
  sails.lift();
  sails.on('ready', function() {
    global.request = supertest(sails.express.app);
    global.socketConnect = function(authToken, cookie) {
      var qs = querystring.stringify({token: authToken, cookie: cookie});
      var s = socket.connect('http://localhost:' + process.env.PORT + '?' + qs, {"force new connection": true});
      socketMixin(s);
      return s;
    };
    setTimeout(done);
  });
});

after(function(done) {
  sails.lower(done);
});


function socketMixin(s) {
  s.get = function (url, data, cb) {
    return this.request(url, data, cb, 'get');
  };

  s.post = function (url, data, cb) {
    return this.request(url, data, cb, 'post');
  };

  s.put = function (url, data, cb) {
    return this.request(url, data, cb, 'put');
  };

  s['delete'] = function (url, data, cb) {
    return this.request(url, data, cb, 'delete');
  };

  s.request = function (url, data, cb, method) {

    var socket = this;

    var usage = 'Usage:\n socket.' +
      (method || 'request') +
      '( destinationURL, dataToSend, fnToCallWhenComplete )';

    // Remove trailing slashes and spaces
    url = url.replace(/^(.+)\/*\s*$/, '$1');

    // If method is undefined, use 'get'
    method = method || 'get';


    if ( typeof url !== 'string' ) {
      throw new Error('Invalid or missing URL!\n' + usage);
    }

    // Allow data arg to be optional
    if ( typeof data === 'function' ) {
      cb = data;
      data = {};
    }

    // Build to request
    var json = JSON.stringify({
      url: url,
      data: data
    });


    // Send the message over the socket
    socket.emit(method, json, function afterEmitted (result) {

      var parsedResult = result;

      if (result && typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          if (typeof console !== 'undefined') {
            console.warn("Could not parse:", result, e);
          }
          throw new Error("Server response could not be parsed!\n" + result);
        }
      }

      // TODO: Handle errors more effectively
      if (parsedResult === 404) throw new Error("404: Not found");
      if (parsedResult === 403) throw new Error("403: Forbidden");
      if (parsedResult === 500) throw new Error("500: Server error");

      cb && cb(parsedResult);

    });
  }
}

var path = require('path');
var app = require(path.join(process.cwd(), 'app.js'));
var supertest = require('supertest')
var chai = require('chai')
var _ = require('lodash')
var socket = require('socket.io-client')
var querystring = require('querystring');
var config = require('lib/config');
require('lib/Reputation/hooks').noCharge = true;
var routerIO = require('lib/router.io-client')(true);

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

global.request = supertest(app);
global.socketConnect = function(token) {
  console.log('token', token);
  var qs = querystring.stringify({access_token: token});
  var url = 'http://localhost:' + config.port + '?' + qs;
  var s = socket.connect(url, {forceNew: true});
  console.log('socket connection');
  return routerIO(s);
};


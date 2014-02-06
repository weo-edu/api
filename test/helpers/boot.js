var sails = require('sails')
  , supertest = require('supertest')
  , chai = require('chai')
  , _ = require('lodash');

chai.use(require('./chai'));
chai.use(require('chai-properties'));
chai.use(require('chai-fuzzy'));
chai.use(require('chai-http'));
chai.use(require('chai-things'));

global._ = _;
global.expect = chai.expect;

// Use a different port for API tests, so that api tests
// can be run without killing any other serves that might
// be running
process.env.PORT = 1339;

before(function(done) {
  sails.lift();
  sails.on('ready', function() {
    global.request = supertest(sails.express.app);
    setTimeout(done);
  });
});

after(function(done) {
  sails.lower(done);
});

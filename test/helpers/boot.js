var sails = require('sails')
  , supertest = require('supertest')
  , chai = require('chai')
  , _ = require('lodash');

chai.use(require('./chai.js'));
chai.use(require('chai-properties'));
chai.use(require('chai-fuzzy'));
chai.use(require('chai-http'));
chai.use(require('chai-things'));

global._ = _;
global.expect = chai.expect;

before(function(done) {
  sails.lift();
  sails.once('ready', function() {
    global.request = supertest(sails.express.app);
    setTimeout(done);
  });
});

after(function(done) {
  sails.lower(done);
});

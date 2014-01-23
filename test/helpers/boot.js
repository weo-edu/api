var sails = require('sails')
  , supertest = require('supertest')
  , chai = require('chai')
  , _ = require('lodash');

global._ = _;
global.expect = chai.expect;

module.exports = function() {
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
};
var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var Faker = require('Faker');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('User', function() {
  var Schema, User;

  before(function() {
    mongoose.plugin(require('lib/schema-plugin-kind'));
    mongoose.plugin(require('lib/schema-plugin-extend'));
    mongoose.plugin(require('lib/schema-plugin-path'));
    mongoose.plugin(require('lib/schema-plugin-discriminator'));
    User = require('../').model;
    Schema = mongoose.Schema;
    moduleTests.prepare();
  });


  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);
  function sanitize(str) {
    return str.replace(/[^\s0-9a-zA-Z\@\.]/g, 'a');
  }

  it('should generate displayName correctly', function(done) {
    var doc = new User({});

    doc.name.honorificPrefix = 'None';
    doc.name.givenName = 'given';
    doc.name.familyName = 'family';

    doc.validate(function() {
      expect(doc.displayName).to.equal('given family');

      doc.name.honorificPrefix = 'Mr.';
      doc.displayName = '';
      doc.validate(function() {
        expect(doc.displayName).to.equal('Mr. family');
        done();
      });
    });
  });

  it('should lowercase username', function(done) {
    var doc = new User({});

    doc.username = 'Test';
    doc.validate(function() {
      expect(doc.username).to.equal('test');
      done();
    });
  });

});
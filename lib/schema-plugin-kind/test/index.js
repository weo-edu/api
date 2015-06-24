var moduleTests = require('lib/boot-module-tests');
var mongoose = require('mongoose');

var chai = require('chai');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('schema-plugin-kind', function() {
  var Schema;

  before(function() {
    moduleTests.prepare();
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  beforeEach(function() {
    // Add this plugin in a beforeEach after prepare()
    // so that it gets destroyed in between tests.
    // This is necessary because this plugin caches
    // things
    mongoose.plugin(require('../'));
  });
  afterEach(moduleTests.cleanup);

  it('should work', function() {
    var A = new Schema({str: String});
    var modelA = mongoose.model('a', A);
    var doc = new modelA();
    expect(doc.kind).to.equal('a');
  });

  it('should work with model discriminators', function(done) {
    var A = new Schema({str: String, type: String}, {discriminatorKey: 'type'});
    var modelA = mongoose.model('a', A);
    modelA.discriminator('test', new Schema({
      str2: {
        type: String,
        default: 'test'
      }
    }, {discriminatorKey: 'type'}));

    var doc = new modelA({type: 'test'});
    doc.save(function() {
      modelA.findById(doc.id).exec(function(err, doc) {
        expect(doc.str2).to.equal('test');
        expect(doc.kind).to.equal('a');
        done();
      });
    });
  });
});
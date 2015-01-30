var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var expect = chai.expect;

describe('schema-plugin-fromJSON', function() {
  var Schema;

  before(function() {
    moduleTests.prepare();
    mongoose.plugin(require('../'));
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);

  it('should unset properties that no longer exist on nested documents', function() {
    var A = new Schema({image: {url: String}});
    A.plugin(require('../'));

    var base = new Schema({object: [A]});

    var Model = mongoose.model('base', base);
    var doc = new Model({object: [{image: {url: 'test'}}]});

    expect(doc.object[0].image.url).to.equal('test');
    var json = doc.toJSON();
    json.object[0].image = undefined;
    doc.fromJSON(json);
    expect(doc.object[0].image.url).to.be.undefined;
  });
});
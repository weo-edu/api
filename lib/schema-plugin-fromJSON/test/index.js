var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var expect = chai.expect;

describe('schema-plugin-fromJSON', function() {
  var Schema;

  before(function() {
    moduleTests.prepare();
  });

  beforeEach(function() {
    mongoose.plugin(require('../'));
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);
  
  it('should unset properties that no longer exist', function() {
    var schema = new Schema({str: String, str2: String});
    var Model = mongoose.model('a', schema);
    var doc = new Model({str: 'test'});
    
    expect(doc.str).to.equal('test');
    expect(doc.str2).to.be.undefined;
    
    doc.fromJSON({str2: 'test2'});
    expect(doc.str).to.be.undefined;
    expect(doc.str2).to.equal('test2');
  });

  it('should unset properties that no longer exist on nested documents', function() {
    var A = new Schema({image: {url: String}});
    A.plugin(require('../'));

    var base = new Schema({object: [A]});

    var Model = mongoose.model('extend', base);
    var doc = new Model({object: [{image: {url: 'test'}}]});

    expect(doc.object[0].image.url).to.equal('test');
    var json = doc.toJSON();
    delete json.object[0].image;
    doc.fromJSON(json);
    expect(doc.object[0].image.url).to.be.undefined;
  });

  it('should work when nested subdoc arrays change size', function() {
    var A = new Schema({str: String});
    A.plugin(require('../'));

    var base = new Schema({object: [A]});

    var Model = mongoose.model('extend', base);
    var doc = new Model({object: []});

    expect(doc.object.length).to.equal(0);

    var json = doc.toJSON();
    json.object.push({str: 'test'});
    doc.fromJSON(json);

    expect(doc.object.length).to.equal(1);
    expect(doc.object[0].str).to.equal('test');

    json.object = [];
    doc.fromJSON(json);
    expect(doc.object.length).to.equal(0);
  });
  
  it('should work when an array goes from undefined to defined and vice versa', function() {
    var A = new Schema({str: String});
    var schema = new Schema({object: [A]});
    var Model = mongoose.model('a', schema);
    
    var doc = new Model({});
    
    doc.fromJSON({object: [{str: 'test'}]});
    expect(doc.object[0].str).to.equal('test');
    
    doc.fromJSON({});
    expect(doc.object.length).to.equal(0);
  });
});
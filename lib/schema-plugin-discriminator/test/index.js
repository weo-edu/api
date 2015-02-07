var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('schema-plugin-discriminator', function() {
  var Schema;

  beforeEach(function() {
    moduleTests.prepare();
    mongoose.plugin(require('../'));
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);

  it('should work', function() {
    var A = new Schema({str: String, type: String}, {discriminatorKey: 'type'});
    A.discriminator('test', {
      str2: {
        type: String,
        default: 'test'
      }
    });

    var modelA = mongoose.model('a', new Schema({object: [A]}));
    var doc = new modelA({object: [{type: 'test'}]});

    expect(doc.object[0].str2).to.equal('test');
    expect(doc.object[0].schema.path('str2')).to.not.be.undefined;
  });

  it('should run appropriate hooks', function(done) {
    var A = new Schema({str: String, type: String}, {discriminatorKey: 'type'});

    var spy1 = sinon.spy(function(next) { next(); });
    A.pre('save', spy1);

    var B = A.discriminator('test', {
      str2: {
        type: String,
        default: 'test'
      }
    });


    var spy2 = sinon.spy(function(next) { next(); });
    B.pre('save', spy2);

    var modelA = mongoose.model('a', new Schema({object: [A]}));
    var doc1 = new modelA({object: [{type: 'asdf'}]});
    var doc2 = new modelA({object: [{type: 'test'}]});

    doc1.save(function() {
      expect(spy1).to.have.been.calledOnce;
      expect(spy2).to.not.have.been.called;

      spy1.reset();
      doc2.save(function() {
        expect(spy1).to.have.been.calledOnce;
        expect(spy2).to.have.been.calledOnce;
        done();
      });
    });
  });

  it('should work with getters and setters on the discriminator key', function() {
    var A = new Schema({str: String, type: String}, {discriminatorKey: 'type'});
    var spy1 = sinon.spy(function(val) { return val; });
    A.path('type').set(spy1);
    A.discriminator('test', {str2: String});

    var base = new Schema({object: [A]});
    var Model = mongoose.model('base', base);
    var doc = new Model({object: [{type: 'test'}]});

    expect(spy1).to.have.been.calledOnce;
    doc.object[0].type = 'asdf';
    expect(spy1).to.have.been.calledThrice;
  });

  it('should rediscriminate when the key changes value', function() {
    var A = new Schema({str: String}, {discriminatorKey: 'type'});
    A.discriminator('test', {
      str2: {
        type: String,
        default: '1'
      }
    });

    A.discriminator('test2', {
      str3: {
        type: String,
        default: '2'
      }
    });

    var base = new Schema({object: [A]});
    var Model = mongoose.model('base', base);
    var doc = new Model({object: [{type: 'test'}]});       

    expect(doc.object[0].str2).to.equal('1');
    expect(doc.object[0].str3).to.be.undefined;

    doc.object[0].type = 'test2';

    expect(doc.object[0].str2).to.be.undefined;
    expect(doc.object[0].str3).to.equal('2');
  });
});
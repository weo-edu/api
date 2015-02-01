var moduleTests = require('lib/boot-module-tests');
var mongoose = require('mongoose');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('schema-plugin-extend', function() {
  var Schema;

  before(function() {
    moduleTests.prepare();
    mongoose.plugin(require('../'));
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);

  it('should work', function() {
    var A = new Schema({
      a: String
    }, {discriminatorKey: 'type'});

    var B = A.extend({
      b: String
    });

    // Expect B to have A's properties
    expect(B.path('a')).to.not.be.undefined;
    expect(B.path('a').options.type).to.equal(String);

    // Expect A not to have B's properties
    expect(A.path('b')).to.be.undefined;
  });

  it('should merge hooks correctly', function(done) {
    var A = new Schema({a: String}, {discriminatorKey: 'type'});

    var spy1 = sinon.spy(function(next) { next(); });
    A.pre('save', spy1);
    var B = A.extend({b: String});

    var spy2 = sinon.spy(function(next) { next(); });
    B.pre('save', spy2);

    var C = B.extend({c: String});
    var spy3 = sinon.spy(function(next) { next(); });
    C.pre('save', spy3);

    var aModel = mongoose.model('a', A);
    var bModel = mongoose.model('b', B);
    var cModel = mongoose.model('c', C);

    var a = new aModel();
    var b = new bModel();
    var c = new cModel();

    a.save(function() {
      expect(spy1).to.have.been.calledOnce;
      expect(spy2).not.to.have.been.called;
      expect(spy3).not.to.have.been.called;

      spy1.reset();

      b.save(function() {
        expect(spy1).to.have.been.calledOnce;
        expect(spy2).to.have.been.calledOnce;
        expect(spy3).not.to.have.been.called;

        spy1.reset();
        spy2.reset();

        c.save(function() {
          expect(spy1).to.have.been.calledOnce;
          expect(spy2).to.have.been.calledOnce;
          expect(spy3).to.have.been.calledOnce;
          done();
        });
      });
    });
  });

  it('should merge properties that exist in both schemas', function(done) {
    var A = new Schema({
      a: {type: String}
    }, {discriminatorKey: 'type'});

    var B = A.extend({
      a: {
        type: String,
        required: true
      }
    });

    var aModel = mongoose.model('a', A);
    var bModel = mongoose.model('b', B);

    var a = new aModel({a: ''});
    var b = new bModel({a: ''});

    a.save(function(err) {
      expect(err).to.be.null;
      b.save(function(err) {
        expect(err).not.to.be.null;
        expect(err.errors.a.type).to.equal('required');
        done();
      });
    });
  });

  it('should work with setter/getters', function() {
    var A = new Schema({a: String});
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    A.path('a').set(spy1);
    A.path('a').get(spy2);

    var B = A.extend({a: String, b: String});
    var bModel = mongoose.model('b', B);

    var doc = new bModel({});
    doc.a = 'test';
    expect(spy1).to.have.been.calledOnce;
    doc.a;
    expect(spy2).to.have.been.calledOnce;
  });

  it('should work with methods and statics', function() {
    var A = new Schema({a: String});
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    A.method('test', spy1);
    A.static('test', spy2);

    var B = A.extend({b: String});

    var bModel = mongoose.model('b', B);
    var doc = new bModel({});

    expect(doc.test).to.not.be.undefined;
    doc.test();
    expect(spy1).to.have.been.calledOnce;
    expect(bModel.test).to.not.be.undefined;
    bModel.test();
    expect(bModel.test).to.have.been.calledOnce;
  });
});
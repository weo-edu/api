var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('schema-plugin-selflink', function() {
  var Schema, selfLink;

  beforeEach(function() {
    moduleTests.prepare();
    mongoose.plugin(require('lib/schema-plugin-extend'));
    selfLink = require('../');
    mongoose.plugin(selfLink);
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);

  it('should aggregate sums of numbers', function() {
    var ASchema = new Schema({
      test: selfLink.embed(function() {
        return 'test';
      }, [{property: 'num', root: true}])
    });

    var BSchema = new Schema({
      actor: {id: String},
      num: Number
    });

    var A = mongoose.model('A', ASchema);
    var B = mongoose.model('B', BSchema);

    var agg = new A({});
    var b = new B({actor: {id: 'user'}, num: 1});

    function total() {
      return agg.selfLink('test').context('test');
    }

    total().push(b);
    expect(total().sum('num')).to.equal(1);

    var c = new B({actor: {id: 'user'}, num: 3});
    total().push(c);

    expect(total().sum('num')).to.equal(4);

    total().remove(b);
    expect(total().sum('num')).to.equal(3);
  });

  it('should replace', function() {
    var ASchema = new Schema({
      test: selfLink.embed(function() {
        return 'test';
      }, [{property: 'num', root: true, replace: true}])
    });

    var BSchema = new Schema({
      actor: {id: String},
      num: Number
    });

    var A = mongoose.model('A', ASchema);
    var B = mongoose.model('B', BSchema);

    var agg = new A({});
    var b = new B({actor: {id: 'user'}, num: 1});

    function total() {
      return agg.selfLink('test').context('test');
    }

    total().push(b);
    expect(total().sum('num')).to.equal(1);

    var c = new B({actor: {id: 'user'}, num: 3});
    total().push(c);

    expect(total().sum('num')).to.equal(3);

    c.num = 10;
    total().update(c);
    expect(total().sum('num')).to.equal(10);
  });

  it('should replace strings', function() {
    var ShareSchema = new Schema({
      actor: {id: String},
      instances: selfLink.embed(function() {
        return 'test';
      }, [{property: 'status', type: String, replace: true, root: true}]),
      status: String
    });

    var Share = mongoose.model('test', ShareSchema);
    var root = new Share({});

    function total() {
      return root.selfLink('instances').context('test');
    }

    total().push(new Share({actor: {id: 'user1'}, status: 'a'}));
    expect(total().sum('status')).to.equal('a');
    expect(total().sum('status', 'user1')).to.equal('a');

    total().push(new Share({actor: {id: 'user2'}, status: 'b'}));
    expect(total().sum('status')).to.equal('b');
    expect(total().sum('status', 'user2')).to.equal('b');

    total().update(new Share({actor: {id: 'user3'}, status: 'c'}));
    expect(total().sum('status')).to.equal('c');
    expect(total().sum('status', 'user3')).to.equal('c');
  });
});

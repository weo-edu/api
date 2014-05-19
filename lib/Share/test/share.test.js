var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');
mongoose.plugin(require('lib/schema-plugin-discriminator'));
mongoose.plugin(require('lib/schema-plugin-events'));

var Share = require('../model');
var Post = require('lib/Object-Posts/schema');
var config = require('lib/config');
mongoose.connect(config.mongo.url);
var access = require('lib/access');
var Seq = require('seq');
var _ = require('lodash');

var base = {
  type: 'post',
  actor: {
    id: new mongoose.Types.ObjectId,
    displayName: 'foo',
    url: 'http://weo.io/foo',
    image: {
      url: 'http://avatar.eos.io/foo'
    }
  },
  _object: [{
    objectType: 'post',
    content: 'testing',
    attachments: [{
      objectType: 'object',
      displayName: 'video',
      content: 'awesoem video',
      image: {
        url: 'cool/image'
      },
      embed: {
        url: 'video/test',
        type: 'dontknow'
      }
    }]
  }],
  to: [{board: 123}],
  verb: 'shared',
  status: 'active'
}

describe('Share model', function() {
  it('should create new', function(done) {
    var share = Share(base);
    share.validate(function(err) {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should add class address properly', function() {
    var share = Share(base);
    var classId = 'classId';
    share.withClass(classId);
    var address = share.address(classId);
    address = address.toJSON();
    expect(address).to.have.property('allow')
      .that.deep.equals([
        access.entry('public', 'teacher'),
        access.entry('group', 'student', classId)
      ]);
  });

  it('should add class address for user share properly', function() {
    var share = Share(base);
    var classId = 'classId';
    var studentId = 'studentId';
    share.withStudent(classId, studentId);
    var address = share.address(classId);
    address = address.toJSON();
    expect(address).to.have.property('allow')
      .that.deep.equals([
        access.entry('public', 'teacher'),
        access.entry('user', 'student', studentId)
      ]);
  });

  it('should validate improper add', function(done) {
    var share = Share(base);
    var classId = 'classId';
    var studentId = 'studentId';
    share.withStudent(classId);
    share.validate(function(err) {
      expect(err.errors).to.have.property('to.1.allow');
      done();
    });
  });


  it('should instantiate object', function(done) {
    var share = Share(base);
    //var weirdShare = new Share(undefined, base, true);
    //console.log('weirdShare', weirdShare);
    Seq()
      .seq(function() {
        expect(share.object.verb()).to.equal('shared');
        expect(share.verb).to.equal('shared');
        share.save(this);
      })
      .seq(function() { this(); })
      .seq(function(res) {
        Share.findById(share.id).exec(this);
      })
      .seq(function(share) {
        expect(share.object.verb()).to.equal('shared');
        this();
      })
      .seq(done);
  });

});
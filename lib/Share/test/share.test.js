var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');

var base = {
  actor: {
    id: new mongoose.Types.ObjectId,
    displayName: 'foo',
    url: 'http://weo.io/foo',
    image: {
      url: 'http://cdn.eos.io/foo'
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
        url: 'video/test'
      }
    }]
  }],
  contexts: [{descriptor: {id: 123}}],
  verb: 'shared'
};

describe('Share model', function() {
  moduleTests.prepare();
  require('lib/db');
  after(moduleTests.cleanup);
  var Share = require('../model');

  it('should create new', function(done) {
    var share = Share(base);
    share.validate(function(err) {
      expect(err).to.be.undefined;
      done();
    });
  });
});
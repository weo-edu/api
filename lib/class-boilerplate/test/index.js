/**
 * Modules
 */
var mongoose = require('mongoose');
var async = require('async');
var chai = require('chai');
var uuid = require('node-uuid');
var _ = require('lodash');


/**
 * Libs
 */
var awaitHooks = require('../../../test/helpers/awaitHooks');
var moduleTests = require('lib/boot-module-tests');
var expect = chai.expect;
chai.use(require('sinon-chai'));

describe('Class boilerplate', function() {

  var createBoilerplate, Teacher, Share, user;


  before(function() {
    
    require('lib/db');
    require('lib/Teacher/model');
    require('lib/Share/model');

    createBoilerplate = require('..');

    Teacher = mongoose.model('teacher');
    Share = mongoose.model('Share');
    
  });


  beforeEach(function() {
    user = new Teacher({
      displayName: 'test teacher',
      username: 'testeacher',
      name: {
        familyName: 'teacher',
        givenName: 'test',
        honorificPrefix: ''
      },
      password: 'testing',
      email: 'testingteacher' + uuid.v1() + '@gmail.com'
    });
  });

  this.timeout(4000);

  it('should generate', function(done) {
    testGenerate(done);
  });

  it('should generate second time', function(done) {
    
    testGenerate(done);
  })


  function testGenerate(done) {
    async.waterfall([
      function(cb) {
        Teacher.findUsernameLike({username: user.username, base: 6}, cb);
      },
      function(username, cb) {
        user.username = username;
        user.save(cb);
      },
      function(user, changed,  cb) {
        createBoilerplate(user, cb);
      },
      awaitHooks,
      function(group, shareId, cb) {
        expect(group.displayName).to.equal('Test Class');
        Share.findById(shareId, cb);
      },
      function(share, cb) {
        expect(share.instances.canonicalTotal.items).to.equal(4);
        _(share.instances.total[0].actors).each(function(aggregation) {
          expect(!!aggregation.turnedInAt).to.be.true;
        })
        cb();
      }
    ], function(err) {
      if (err) console.error(err);
      done();
    })
  }

});
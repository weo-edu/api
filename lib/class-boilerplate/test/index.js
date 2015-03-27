/**
 * Modules
 */
var async = require('async');
var uuid = require('node-uuid');
var _ = require('lodash');

var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));


/**
 * Libs
 */
var awaitHooks = require('../../../test/helpers/awaitHooks');
var moduleTests = require('lib/boot-module-tests');


describe('Class boilerplate', function() {

  var createBoilerplate, Teacher, Share, user;

  before(moduleTests.prepare);
  before(moduleTests.connect);

  beforeEach(function() {
    require('lib/db/plugins')();
    Teacher = require('lib/Teacher/model');

    Share = require('lib/Share/model');
    require('lib/Question/model');
    require('lib/Object/model');
    require('lib/Object/types/Section/model');
    require('lib/Object/types/Media/model');
    
    createBoilerplate = require('..');
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

  this.timeout(6000);

  after(moduleTests.cleanup);

  it('should generate', function(done) {
    testGenerate(done);
  });

  it('should generate second time', function(done) {
    
    testGenerate(done);
  });


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
        expect(group.displayName).to.equal('Example Class');
        Share.findById(shareId, cb);
      },
      function(share, cb) {
        expect(share.instances.canonicalTotal.items).to.equal(4);
        _(share.instances.total[0].actors).each(function(aggregation) {
          expect(!!aggregation.turnedInAt).to.be.true;
        });
        cb();
      }
    ], function(err) {
      if (err) console.error(err);
      done();
    });
  }

});
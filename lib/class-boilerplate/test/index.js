var mongoose = require('mongoose');
var awaitHooks = require('../../../test/helpers/awaitHooks');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var expect = chai.expect;
var uuid = require('node-uuid');

chai.use(require('sinon-chai'));

describe('Class boilerplate', function() {

  var createBoilerplate;


  before(function() {
    mongoose.plugin(require('lib/schema-plugin-kind'));
    mongoose.plugin(require('lib/schema-plugin-extend'));
    mongoose.plugin(require('lib/schema-plugin-path'));
    mongoose.plugin(require('lib/schema-plugin-discriminator'));
    mongoose.plugin(require('lib/schema-plugin-post'));
    mongoose.plugin(require('lib/schema-plugin-was-modified'));
    createBoilerplate = require('../');
    moduleTests.prepare();
  });


  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);


  it('should generate', function(done) {
    var Teacher = mongoose.model('teacher');
    var user = new Teacher({
      displayName: 'test teacher',
      username: 'testeacher',
      name: {
        familyName: 'teacher',
        givenName: 'test',
        honorificPrefix: 'None'
      },
      password: 'testing',
      email: 'testingteacher' + uuid.v1() + '@gmail.com'
    });
    Teacher.findUsernameLike({username: user.username, base: 6}, function(err, username) {
      user.username = username;
      user.save(function(err) {
        if (err) throw err;
        createBoilerplate(user, function(err, share) {
          if (err) throw err;
          awaitHooks(function() {
            expect(share.actor.displayName).to.equal(user.displayName);
            done();
          })
          
        });
      })
    })
    
  });

});
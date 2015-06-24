var Seq = require('seq');
var UserHelper = require('./helpers/user');
var GroupHelper = require('./helpers/group');
var Group = require('lib/Group/model');
var awaitHooks = require('./helpers/awaitHooks');
var _ = require('lodash');

require('./helpers/boot');

describe('Board', function() {
  var user;
  before(function(done) {
    Seq()
      .seq(function() {
        UserHelper.createAndLogin(this);
      })
      .seq(function(teacher) {
        user = teacher;
        this();
      })
      .seq(done);
  });

  describe('create', function(){
    it('should create new group and add user to group', function(done) {
      var group;
      Seq()
        .seq(function() {
          request
            .post('/board')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          group = res.body;
          request
            .get('/' + [user.userType, user.id].join('/'))
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body.groups).to.contain.an.item.with.properties({id: group.id});
          this();
        })
        .seq(done);
    })

  });

});
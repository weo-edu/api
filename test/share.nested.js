var Seq = require('seq')
  , User = require('./helpers/user')
  , Share = require('./helpers/share')
  , Group = require('./helpers/group')
  , access = require('lib/access');

require('./helpers/boot');

describe('nested share', function() {
  var user = null
    , group = null
    , post = null;

  before(function(done) {
    Seq()
      .seq(function() {
        User.createAndLogin(this);
      })
      .seq(function(u) {
        user = u;
        request
          .post('/group')
          .send(Group.generate())
          .set('Authorization', user.token)
          .end(this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        group = res.body;
        Share.post({}, group.id, user.token, this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        post = res.body;
        this();
      })
      .seq(done);
  });

  it('should validate', function(done) {
    Seq()
      .seq(function() {
        Share.post({channel: post.id + ':discussion'}, group.id, user.token, this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        this();
      })
      .seq(done);
  });

  it('nested feed should only contain nested shares', function(done) {
    var nested = null;
    var channel = 'share!' + post.id + '.' + post._object[0]._id + '.replies'

    Seq()
      .seq(function() {
        connectUser(user, this);
      })
      .seq(function() {
        var self = this;
        user.con.post('/share/subscription', {channel: channel}, function() {
          self();
        })
      })
      .seq(function() {
        Share.post({channels: [channel]}, group.id, user.token, this);
      })
      .seq(function(res) {
        nested = res.body;
        Share.feed(user, {context: group.id, channel: channel}, user.token, this);
      })
      .seq(function(res) {
        var shares = res.body;
        expect(shares).not.to.containOneLike({id: post.id});
        expect(user.messages.length).to.equal(1);
        this();
      })
      .seq(done);
  });
});

function connectUser(user, cb) {
  var con = socketConnect(user.socketToken);
  con.on('message', function(msg) {
    user.messages.push(msg);
  });
  con.on('connect', function() {
    cb(null, con);
  });
  user.con = con;
  user.messages = [];
}
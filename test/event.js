var Seq = require('seq')
  , User = require('./helpers/user.js')
  , Event = require('./helpers/event.js');

require('./helpers/boot.js');
describe('Event controller', function() {
  var authToken
    , user;
  before(function(done) {
    Seq()
      .seq(function() {
        user = User.create(this);
      })
      .seq(function() {
        User.login(user.username, user.password, this);
      })
      .seq(function(res) {
        authToken = 'Bearer ' + res.body.token;
        this();
      })
      .seq(done);
  });

  describe('entity validation', function() {
    it('should validate sub-entities', function(done) {
      Seq()
        .seq(function() {
          this.vars.evt = Event.post({}, user, authToken, this);
        })
        .seq(function(res) {
          var evt = this.vars.evt;
          expect(res).to.have.status(201);
          delete evt.object.guid;
          request
            .post('/' + [user.type, 'events'].join('/'))
            .set('Authorization', authToken)
            .send(evt)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.ValidationError('invalid', 'object');
          this();
        })
        .seq(done);
    });
  });

  describe('posting an event', function() {
    it('should show up in a users feed', function(done) {
      Seq()
        .seq(function() {
          this.vars.evt = Event.post({}, user, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Event.events(user, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          expect(res.body).to.include.an.item.with.properties(this.vars.evt);
          this();
        })
        .seq(done);
    });

    it('should show up in the users groups feeds', function(done) {
      Seq()
        .seq(function() {
          this.vars.evt = Event.post({}, user, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Event.feed(user, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.include.an.item.with.properties(this.vars.evt);
          this();
        })
        .seq(done);
    });
  });
});
var Seq = require('seq')
  , User = require('./helpers/user')
  , Event = require('./helpers/event');

require('./helpers/boot');
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

  describe('reading the feed', function() {
    it('should show up in chronological order', function(done) {
      Seq(_.range(1, 20))
        .seqEach(function() {
          var self = this;
          setTimeout(function() {
            Event.post({}, user, authToken, self);
          }, 20);
        })
        .seq(function(responses) {
          _.each(responses, function(res) {
            expect(res).to.have.status(201);
          });

          Event.feed(user, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          var last = Infinity;
          _.each(res.body, function(item) {
            var time = + new Date(item.createdAt);
            expect(time).to.be.a.Number;
            expect(time).to.be.below(last);
            last = time;
          });
          this();
        })
        .seq(done);
    });
  });
});
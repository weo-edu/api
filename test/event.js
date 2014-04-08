var Seq = require('seq')
  , User = require('./helpers/user')
  , Event = require('./helpers/event')
  , Group = require('./helpers/group');

require('./helpers/boot');
describe('Event controller', function() {
  var authToken
    , user
    , group;
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
      .seq(function() {
        request
          .post('/group')
          .send(Group.generate())
          .set('Authorization', authToken)
          .end(this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        group = res.body;
        this();
      })
      .seq(done);
  });

  describe('entity validation', function() {
    it('should validate sub-entities', function(done) {
      Seq()
        .seq(function() {
          this.vars.evt = Event.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          var evt = this.vars.evt;
          expect(res).to.have.status(201);
          delete evt.object.id;
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
          this.vars.evt = Event.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Event.feed(user, [group.id], authToken, this);
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
          this.vars.evt = Event.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Event.feed(user, [group.id], authToken, this);
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
      Seq(_.range(1, 5))
        .seqEach(function() {
          var self = this;
          Event.post({}, group.id, authToken, function(err, res) {
            self(err, res);
          });
        })
        .seq(function(responses) {
          _.each(responses, function(res) {
            expect(res).to.have.status(201);
          });
          Event.feed(user, [group.id], authToken, this);
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

  describe('queueing an event', function() {
    it('should show up in feed', function(done) {
      Seq()
        .seq(function() {
          this.vars.evt = Event.queue({}, group.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Event.feed(user, [group.id], authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          expect(res.body).to.include.an.item.with.properties(this.vars.evt);
          this();
        })
        .seq(done);
    });

    it('should show queued events before published events', function(done) {
      Seq()
        .seq(function() {
          Event.queue({}, group.id, authToken, this);
        })
        .seq(function(res) {
          this.vars.queued = res.body;
          expect(res).to.have.status(201);
          Event.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          this.vars.event = res.body;
          expect(res).to.have.status(201);
          Event.feed(user, [group.id], authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          var events = res.body;
          expect(events).to.be.an.array;
          expect(events[0].id).to.equal(this.vars.queued.id);
          this();
        })
        .seq(done);
    });
  });

  describe('deleting an event', function() {
    it('should succeed for queued events', function(done) {
      Seq()
        .seq(function() {
          Event.queue({}, group.id, authToken, this);
        })
        .seq(function(res) {
          var queued = res.body;
          expect(res).to.have.status(201);
          Event.del(queued.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(204);
          this();
        })
        .seq(done);
    });

    it('should fail for active events', function(done) {
      Seq()
        .seq(function() {
          Event.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          var queued = res.body;
          expect(res).to.have.status(201);
          Event.del(queued.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(403);
          this();
        })
        .seq(done);
    });
  });


});
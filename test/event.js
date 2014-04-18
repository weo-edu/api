var Seq = require('seq')
  , User = require('./helpers/user')
  , Event = require('./helpers/event')
  , Group = require('./helpers/group')
  , Cookie = require('cookie');

require('./helpers/boot');
describe('Event controller', function() {
  var authToken
    , user
    , group
    , token
    , cookie;
  before(function(done) {
    Seq()
      .seq(function() {
        user = User.create(this);
      })
      .seq(function() {
        User.login(user.username, user.password, this);
      })
      .seq(function(res) {
        token = res.body.token;
        cookie = Cookie.parse(res.headers['set-cookie'][0]);
        cookie = Cookie.serialize('sails.sid', cookie['sails.sid']);
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


  describe('live event', function() {
    var scTeacher = null
      , scStudent = null
      , teacherMessages = []
      , studentMessages = [];

    before(function(done) {
      Seq()
        .par(function() {
          connectNewUser({}, this);
        })
        .par(function() {
          connectNewUser({type: 'student'}, this);
        })
        .seq(function(tCon, sCon) {
          scTeacher = tCon;
          scTeacher.on('message', function(msg) {
            teacherMessages.push(msg);
          });
          scStudent = sCon;
          scStudent.on('message', function(msg) {
            studentMessages.push(msg);
          });
          scTeacher.post('/event/subscription', {to: group.id});
          scStudent.post('/event/subscription', {to: group.id});
          this();
        })
        .seq(done);
    });


    beforeEach(function() {
      teacherMessages = [];
      studentMessages = [];
    });

    it('teacher should receive its emitted events', function(done) {
      Seq()
        .seq(function() {
          Event.post({}, group.id, authToken, this);
        })
        .seq(function() {
          expect(teacherMessages).to.have.length(1);
          expect(teacherMessages[0].id).to.equal(group.id);
          this();
        })
        .seq(done);
    });

    it('student should receive teacher events', function(done) {
      Seq()
        .seq(function() {
          Event.post({}, group.id, authToken, this);
        })
        .seq(function() {
          expect(studentMessages).to.have.length(1);
          expect(studentMessages[0].id).to.equal(group.id);
          this();
        })
        .seq(done);
    });

    it('teacher should receive queued posts and students should not', function(done) {
      Seq()
        .seq(function() {
          Event.queue({}, group.id, authToken, this);
        })
        .seq(function() {
          expect(teacherMessages).to.have.length(1);
          expect(teacherMessages[0].id).to.equal(group.id);
          expect(studentMessages).to.have.length(0);
          this();
        })
        .seq(done);
    })
  });
});


function connectNewUser(opts, cb) {
  opts = opts || {};
  var user, token, cookie;
  Seq()
    .seq(function() {
      user = User.create(opts, this);
    })
    .seq(function() {
      User.login(user.username, user.password, this);
    })
    .seq(function(res) {
      token = res.body.token;
      var con = socketConnect(token, res.headers['set-cookie'].join(';'))
      con.on('connect', function() {
        cb(null, con);
      })
    });
}
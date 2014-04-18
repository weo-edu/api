var Seq = require('seq')
  , User = require('./helpers/user')
  , Share = require('./helpers/share')
  , Group = require('./helpers/group')
  , Cookie = require('cookie');

require('./helpers/boot');
describe('Share controller', function() {
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

  describe('creating a share', function() {
    it('should populate actor', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(res).to.have.status(201);
          expect(share.actor).to.have.property('name');
          this();
        })
        .seq(done);
    });
  });

  describe('posting a share', function() {
    it('should show up in a users feed', function(done) {
      Seq()
        .seq(function() {
          this.vars.share = Share.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Share.feed(user, [group.id], authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          expect(res.body).to.include.an.item.with.properties(this.vars.share);
          this();
        })
        .seq(done);
    });

    it('should show up in the users groups feeds', function(done) {
      Seq()
        .seq(function() {
          this.vars.share = Share.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Share.feed(user, [group.id], authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.include.an.item.with.properties(this.vars.share);
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
          Share.post({}, group.id, authToken, function(err, res) {
            self(err, res);
          });
        })
        .seq(function(responses) {
          _.each(responses, function(res) {
            expect(res).to.have.status(201);
          });
          Share.feed(user, [group.id], authToken, this);
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

  describe('queueing an share', function() {
    it('should show up in feed', function(done) {
      Seq()
        .seq(function() {
          this.vars.share = Share.queue({}, group.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          Share.feed(user, [group.id], authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          expect(res.body).to.include.an.item.with.properties(this.vars.share);
          this();
        })
        .seq(done);
    });

    it('should show queued shares before published shares', function(done) {
      Seq()
        .seq(function() {
          Share.queue({}, group.id, authToken, this);
        })
        .seq(function(res) {
          this.vars.queued = res.body;
          expect(res).to.have.status(201);
          Share.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          this.vars.share = res.body;
          expect(res).to.have.status(201);
          Share.feed(user, [group.id], authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          var shares = res.body;
          expect(shares).to.be.an.array;
          expect(shares[0].id).to.equal(this.vars.queued.id);
          this();
        })
        .seq(done);
    });
  });

  describe('deleting an share', function() {
    it('should succeed for queued shares', function(done) {
      Seq()
        .seq(function() {
          Share.queue({}, group.id, authToken, this);
        })
        .seq(function(res) {
          var queued = res.body;
          expect(res).to.have.status(201);
          Share.del(queued.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(204);
          this();
        })
        .seq(done);
    });

    it('should fail for active shares', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, authToken, this);
        })
        .seq(function(res) {
          var queued = res.body;
          expect(res).to.have.status(201);
          Share.del(queued.id, authToken, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(403);
          this();
        })
        .seq(done);
    });
  });


  describe('live share', function() {
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
          scTeacher.post('/share/subscription', {to: group.id});
          scStudent.post('/share/subscription', {to: group.id});
          this();
        })
        .seq(done);
    });


    beforeEach(function() {
      teacherMessages = [];
      studentMessages = [];
    });

    it('teacher should receive its emitted shares', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, authToken, this);
        })
        .seq(function() {
          expect(teacherMessages).to.have.length(1);
          expect(teacherMessages[0].id).to.equal(group.id);
          this();
        })
        .seq(done);
    });

    it('student should receive teacher shares', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, authToken, this);
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
          Share.queue({}, group.id, authToken, this);
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
      var con = socketConnect(res.headers['set-cookie'].join(';'))
      con.on('connect', function() {
        cb(null, con);
      })
    });
}
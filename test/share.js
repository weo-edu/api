var Seq = require('seq')
  , User = require('./helpers/user')
  , Share = require('./helpers/share')
  , Group = require('./helpers/group')
  , Cookie = require('cookie')
  , access = require('lib/access');

require('./helpers/boot');
describe('Share controller', function() {
  var user = null
    , group = null;

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
        this();
      })
      .seq(done);
  });

  describe('creating a share', function() {
    it('should populate actor and full path', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(res).to.have.status(201);
          expect(share.actor).to.have.property('displayName');
          expect(share).to.have.property('fullPath')
          this();
        })
        .seq(done);
    });
  });

  var util = require('util');
  describe('posting a share', function() {
    var student = null;
    before(function(done) {
      Seq()
        .seq(function() {
          User.createAndLogin({userType: 'student'}, this);
        })
        .seq(function(s) {
          student = s;
          Group.join(group, student, this);
        })
        .seq(function() {
          done();
        });

    });

    it('should show up in a users feed', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          this.vars.share = res.body;
          Share.feed(user, [group.id], user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          expect(res.body.items).to.include.an.item.with.properties({id: this.vars.share.id});
          this();
        })
        .seq(done);
    });

    it('should list student as member', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group.id, user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          Share.members(share._id, group.id, user.token, this);
        })
        .seq(function(res) {
          var students = res.body;
          expect(students.items).to.have.length(1);
          done();
        });
    });
  });

  describe('reading the feed', function() {
    beforeEach(function(done) {
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
          this();
        })
        .seq(done);
    });

    it('should show up in chronological order', function(done) {
      Seq(_.range(1, 5))
        .seqEach(function() {
          var self = this;
          Share.post({}, group.id, user.token, function(err, res) {
            self(err, res);
          });
        })
        .seq(function(responses) {
          _.each(responses, function(res) {
            expect(res).to.have.status(201);
          });
          Share.feed(user, [group.id], user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an.array;

          var last = Infinity;
          _.each(res.body.items, function(item) {
            var time = + new Date(item.createdAt);
            expect(time).to.be.a.Number;
            expect(time).to.be.below(last);
            last = time;
          });
          this();
        })
        .seq(done);
    });

    it('should allow paging', function(done) {
      var last = null;
      Seq(_.range(1, 5))
        .seqEach(function() {
          var self = this;
          Share.post({}, group.id, user.token, function(err, res) {
            self(err, res);
          });
        })
        .seq(function() {
          Share.feed(user, {context: group.id, maxResults: 2}, user.token, this);
        })
        .seq(function(res) {
          var shares = res.body.items;
          expect(shares).to.have.length(2);
          last = shares[1];
          Share.feed(user, {context: group.id, maxResults: 2, pageToken: res.body.nextPageToken}, user.token, this);
        })
        .seq(function(res) {
          var shares = res.body.items;
          expect(shares).to.have.length(2);
          expect(shares[1].id).not.to.equal(last.id)
          Share.feed(user, {context: group.id, maxResults: 2, pageToken: res.body.nextPageToken}, user.token, this);
        })
        .seq(function(res) {
          var shares = res.body.items;
          expect(shares).to.have.length(1);
          expect(res.body.nextPageToken).to.be.undefined;
          this();
        })
        .seq(done);
    });
  });

  describe('queueing a share', function() {
    it('should show up in feed', function(done) {
      Seq()
        .seq(function() {
          Share.queue({}, group.id, user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          this.vars.share = res.body;
          Share.feed(user, [group.id], user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an.array;
          expect(res.body.items).to.include.an.item.with.properties({id: this.vars.share.id});
          this();
        })
        .seq(done);
    });

    it('should show queued shares before published shares', function(done) {
      Seq()
        .seq(function() {
          Share.queue({}, group.id, user.token, this);
        })
        .seq(function(res) {
          this.vars.queued = res.body;
          expect(res).to.have.status(201);
          Share.post({}, group.id, user.token, this);
        })
        .seq(function(res) {
          this.vars.share = res.body;
          expect(res).to.have.status(201);
          Share.feed(user, [group.id], user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          var shares = res.body.items;
          expect(shares).to.be.an.array;
          expect(shares[0].id).to.equal(this.vars.queued.id);
          this();
        })
        .seq(done);
    });
  });

  describe('deleting a share', function() {
    it('should succeed for queued shares', function(done) {
      Seq()
        .seq(function() {
          Share.queue({}, group.id, user.token, this);
        })
        .seq(function(res) {
          var queued = res.body;
          expect(res).to.have.status(201);
          Share.del(queued.id, user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          this();
        })
        .seq(done);
    });
  });

  describe('access', function() {
    var teacher = null
      , student = null
      , teacherMember = null
      , studentMember = null;

    before(function(done) {
      Seq()
      .seq(function() {
        teacherMember = user;
        User.createAndLogin({userType: 'student'},this);
      })
      .seq(function(s) {
        student = s;
        User.createAndLogin(this);
      })
      .seq(function(t) {
        teacher = t;
        User.createAndLogin({userType: 'student'}, this);
      })
      .seq(function(s) {
        studentMember = s;
        Group.join(group, studentMember, this);
      })
      .seq(function() {
        this(null, [teacher, student, teacherMember, studentMember])
      })
      .flatten()
      .parEach(function(user) {
        connectUser(user, this);
      })
      .seq(function() {
        this(null, [teacher, student, teacherMember, studentMember])
      })
      .flatten()
      .parEach(function(user) {
        var self = this;
        user.con.post('/share/subscription', {context: group.id}, function() {
          self();
        });
      })
      .seq(function() {
        done();
      })
    });

    describe('post to class', function() {
      var post = null;
      before(function() {
        _.each([teacher, student, teacherMember, studentMember], function(user) {
          user.messages = [];
        });
      });

      before(function(done) {
        Seq()
          .seq(function() {
            Share.post({}, group.id, teacherMember.token, this)
          })
          .seq(function(res) {
            post = res.body;
            this();
          })
          .seq(done);

      });

      it('should be in teacher feed', function(done) {
        checkinFeed(teacher, group, post, done);
      });

      it('should be in teacher member feed', function(done) {
        checkinFeed(teacherMember, group, post, done);
      });

      it('should be in student member feed', function(done) {
        checkinFeed(studentMember, group, post, done);
      });

      it('should not be in student feed', function(done) {
        checkNotInFeed(student, group, post, done);
      });

      describe('live updates', function() {
        it('should appear in teacher feed', function() {
          expect(teacher.messages.length).to.equal(1);
        });

        it('should appear in teacher member feed', function() {
          expect(teacherMember.messages.length).to.equal(1);
        });

        it('shold appear in student member feed', function() {
          expect(studentMember.messages.length).to.equal(1);
        });

        it('should not appear in student feed', function() {
          expect(student.messages.length).to.equal(0);
        });
      });
    });

    describe('post to individual', function() {
      var post = null;

      before(function() {
        _.each([teacher, student, teacherMember, studentMember], function(user) {
          user.messages = [];
        });
      });

      before(function(done) {
        Seq()
          .seq(function() {
            Share.post({
              contexts: [{
                id: group.id,
                allow: [
                  access.entry('group', 'teacher', group.id),
                  access.entry('user', 'student', studentMember.id)
                ]
              }]
            }, group.id, teacherMember.token, this);
          })
          .seq(function(res) {
            post = res.body;
            done();
          });
      });

      it('should not be in teacher feed', function(done) {
        checkNotInFeed(teacher, group, post, done);
      });

      it('should be in teacher member feed', function(done) {
        checkinFeed(teacherMember, group, post, done);
      });

      it('should be in student member feed', function(done) {
        checkinFeed(studentMember, group, post, done);
      });

      it('should not be in student feed', function(done) {
        checkNotInFeed(student, group, post, done);
      });

      describe('live updates', function() {
        it('should not appear in teacher feed', function() {
          expect(teacher.messages.length).to.equal(0);
        });

        it('should appear in teacher member feed', function() {
          expect(teacherMember.messages.length).to.equal(1);
        });

        it('shold appear in student member feed', function() {
          expect(studentMember.messages.length).to.equal(1);
        });

        it('should not appear in student feed', function() {
          expect(student.messages.length).to.equal(0);
        });
      });
    });

    describe('queue to class', function() {
      var post = null;

      before(function() {
        _.each([teacher, student, teacherMember, studentMember], function(user) {
          user.messages = [];
        });
      });

      before(function(done) {
        Seq()
          .seq(function() {
            Share.queue({}, group.id, teacherMember.token, this)
          })
          .seq(function(res) {
            post = res.body;
            this();
          })
          .seq(done);
      });

      it('should be in teacher member feed', function(done) {
        checkinFeed(teacherMember, group, post, done);
      });

      it('should not be in student member feed', function(done) {
        checkNotInFeed(studentMember, group, post, done);
      });

      describe('live updates', function() {
        it('should appear in teacher member feed', function() {
          expect(teacherMember.messages.length).to.equal(1);
        });

        it('should not appear in student feed', function() {
          expect(studentMember.messages.length).to.equal(0);
        });
      });
    });
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

function checkinFeed(user, group, post, done) {
  Seq()
    .seq(function() {
      Share.feed(user, group.id, user.token, this)
    })
    .seq(function(res) {
      var shares = res.body.items;
      var shareIds = _.pluck(shares, '_id');
      expect(shareIds.indexOf(post._id)).to.be.at.least(0);
      this()
    })
    .seq(done);
}

function checkNotInFeed(user, group, post, done) {
  Seq()
    .seq(function() {
      Share.feed(user, group.id, user.token, this)
    })
    .seq(function(res) {
      var shares = res.body.items;
      expect(shares.length).to.satisfy(function(length) {
        if (length) {
          return shares[0].id != post.id;
        } else {
          return true;
        }
      });
      this()
    })
    .seq(done);
}

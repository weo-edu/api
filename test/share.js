require('./helpers/boot');

var Seq = require('seq');
var User = require('./helpers/user');
var Share = require('./helpers/share');
var GroupHelper = require('./helpers/group');
var Group = require('lib/Group/model');
var Cookie = require('cookie');
var access = require('lib/access');
var awaitHooks = require('./helpers/awaitHooks');
var status = require('lib/Share/status');
var assert = require('assert');

describe('Share controller', function() {
  var user = null;
  var group = null;
  var board = null;

  before(function(done) {
    Seq()
      .seq(function() {
        User.createAndLogin(this);
      })
      .seq(function(u) {
        user = u;
        request
          .post('/group')
          .send(GroupHelper.generate())
          .set('Authorization', user.token)
          .end(this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        group = res.body;
        request
          .post('/board')
          .send(GroupHelper.generate())
          .set('Authorization', user.token)
          .end(this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        board = res.body;
        this();
      })
      .seq(done);
  });

  describe('creating a share', function() {
    it('should populate actor', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(res).to.have.status(201);
          expect(share.actor).to.have.property('displayName');
          this();
        })
        .seq(done);
    });

    it('should not allow the user to set the content field directly', function(done) {
      var prevContent;
      Seq()
        .seq(function() {
          Share.post({
            _object: [{
              objectType: 'section',
              attachments: [{
                objectType: 'post',
                originalContent: 'test',
              }]
            }]
          }, group, user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(res).to.have.status(201);
          var post = share._object[0].attachments[0];
          prevContent = post.content;
          post.content = 'asdf';
          Share.updateShare(share, user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          var share = res.body;
          expect(share._object[0].attachments[0].content).to.equal(prevContent);
          done();
        });
    });

    it('should be copyable', function(done) {
      var share1;
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          share1 = res.body;
          expect(res).to.have.status(201);
          Share.copy(share1, user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          assert.deepEqual(_.omit(share._object[0], 'id'), _.omit(share1._object[0], 'id'));
          assert.notDeepEqual(share.channels, share1.channels);
          assert.notDeepEqual(share.contexts, share1.contexts);
          assert.notEqual(share.id, share1.id);
          assert.deepEqual(share.actor, share1.actor);
          this();
        })
        .seq(done);
    });

    describe('should be copyable', function() {
      var user2;
      before(function(done) {
        Seq()
          .seq(function() {
            User.createAndLogin(this);
          })
          .seq(function(user) {
            user2 = user;
            done();
          })

      })

      it('by other user', function(done) {
        var share1;
        Seq()
          .seq(function() {
            Share.post({}, group, user.token, this);
          })
          .seq(function(res) {
            share1 = res.body;
            expect(res).to.have.status(201);
            Share.copy(share1, user2.token, this);
          })
          .seq(function(res) {
            var share = res.body;
            assert.deepEqual(_.omit(share._object[0], 'id'), _.omit(share1._object[0], 'id'));
            assert.notDeepEqual(share.channels, share1.channels);
            assert.notDeepEqual(share.contexts, share1.contexts);
            assert.notEqual(share.id, share1.id);
            assert.notDeepEqual(share.actor, share1.actor);
            this();
          })
          .seq(done);
      });
    });

    it('should be assignable', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, [], user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(res).to.have.status(201);
          expect(share.actor).to.have.property('displayName');
          expect(share.channels.length).to.equal(0);
          Share.assign(share, [group.id], user.token, this)
        })
        .seq(function(res) {
          var share = res.body;
          expect(share.channels.length).to.equal(1);
          this();
        })
        .seq(done);
    });

    it('should be pinnable', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, [], user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(res).to.have.status(201);
          expect(share.channels.length).to.equal(0);
          expect(share.actor).to.have.property('displayName');
          Share.pin(share, [board.id], user.token, this)
        })
        .seq(function(res) {
          var share = res.body;
          expect(share.channels.length).to.equal(1);
          this();
        })
        .seq(done);

    });

  });

  describe('posting a share', function() {
    var student = null;
    before(function(done) {
      Seq()
        .seq(function() {
          User.createAndLogin({userType: 'student'}, this);
        })
        .seq(function(s) {
          student = s;
          GroupHelper.join(group, student, this);
        })
        .seq(function() {
          done();
        });
    });

    it('should show up in a users feed', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          this.vars.share = res.body;
          Share.feed(['group!' + group._id + '.board'], user.token, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an.array;
          expect(res.body.items).to.include.an.item.with.properties({_id: this.vars.share._id});
          this();
        })
        .seq(done);
    });

    it('should list student as member', function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          var share = res.body;
          Share.members(share._id, group._id, user.token, this);
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
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(awaitHooks)
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
          Share.post({published: true}, group, user.token, this);
        })
        .seq(function(responses) {
          _.each(responses, function(res) {
            expect(res).to.have.status(201);
          });
          Share.feed(['group!' + group._id + '.board'], user.token, this);
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
      var channel = 'group!' + group._id + '.board';
      Seq(_.range(0, 5))
        .seqEach(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(awaitHooks)
        .seq(function() {
          Share.feed({
            channel: channel,
            maxResults: 2
          }, user.token, this);
        })
        .seq(function(res) {
          var shares = res.body.items;
          expect(shares).to.have.length(2);
          last = shares[1];

          Share.feed({
            channel: channel,
            maxResults: 2,
            pageToken: res.body.nextPageToken
          }, user.token, this);
        })
        .seq(function(res) {
          var shares = res.body.items;
          expect(shares).to.have.length(2);
          expect(shares[1]._id).not.to.equal(last._id)

          Share.feed({
            channel: channel,
            maxResults: 2,
            pageToken: res.body.nextPageToken
          }, user.token, this);
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

  describe('instances', function() {
    var student = null,
      student2 = null;
    before(function(done) {
      Seq()
        .seq(function() {
          User.createAndLogin({userType: 'student'}, this);
        })
        .seq(function(s) {
          student = s;
          GroupHelper.join(group, student, this);
        })
        .seq(function() {
          User.createAndLogin({userType: 'student'}, this);
        })
        .seq(function(s) {
          student2 = s;
          GroupHelper.join(group, student2, this);
        })
        .seq(function() {
          done();
        });
    });

    it('should create instances for students on share publish', function(done) {
      Seq()
        .seq(function() {
          Share.post({
            published: true,
            object: {
              objectType: 'section',
              attachments: [{objectType: 'text'}]
            }
          }, group, user.token, this);
        })
        .seq(awaitHooks)
        .seq(function(res) {
          var share = res.body;
          request
            .get('/share/' + share._id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(share.instances.total[0].actors[student._id].status).to.equal(status.unopened);
          expect(share.instances.total[0].actors[student2._id].status).to.equal(status.unopened);
          this();
        })
        .seq(done);
    });

    it('should create an opened instance when a student requests it', function(done) {
      var share;
      Seq()
        .seq(function() {
          Share.post({description: 'this is a description'}, group, user.token, this);
        })
        .seq(function(res) {
          share = res.body;
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          var inst = res.body;
          expect(inst.description).to.equal('this is a description')
          expect(inst.actor.id).to.equal(student._id);
          expect(inst.root.id).to.equal(share._id);
          expect(inst.status).to.equal(status.opened);
          request
            .get('/share/' + share._id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var share = res.body;
          // check status aggregation
          expect(share.instances.total[0].actors[student._id].status).to.equal(status.opened);
          this();
        })
        .seq(done);
    });

    it('should create an unopened instance when a teacher requests it', function(done) {
      var share;
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          share = res.body;
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var inst = res.body;
          expect(inst.actor.id).to.equal(student._id);
          expect(inst.root.id).to.equal(share._id);
          expect(inst.status).to.equal(status.unopened);
          this();
        })
        .seq(done);
    });

    it('should change from unstarted to pending if a teacher requests it and then the student requests it', function(done) {
      var share;
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          share = res.body;
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var inst = res.body;
          expect(inst.actor.id).to.equal(student._id);
          expect(inst.root.id).to.equal(share._id);
          expect(inst.status).to.equal(status.unopened);
          this();
        })
        .seq(function() {
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          var inst = res.body;
          expect(inst.actor.id).to.equal(student._id);
          expect(inst.root.id).to.equal(share._id);
          expect(inst.status).to.equal(status.opened);
          expect(inst.verb).to.equal('started');
          this();
        })
        .seq(done);
    });

    it('should set the verb to "completed" on turn in', function(done) {
      var share;
      Seq()
        .seq(function() {
          Share.post({}, group, user.token, this);
        })
        .seq(function(res) {
          share = res.body;
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          var inst = res.body;
          expect(inst.actor.id).to.equal(student._id);
          expect(inst.root.id).to.equal(share._id);
          expect(inst.verb).to.equal('started');
          inst.status = status.turnedIn;
          request
            .put('/share/' + inst._id + '/instance')
            .set('Authorization', student.token)
            .send(inst)
            .end(this);
        })
        .seq(function(res) {
          var inst = res.body;
          expect(inst.verb).to.equal('completed');
          request
            .get('/share/' + share._id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var share = res.body;
          expect(share.instances.total[0].actors[student._id].status).to.equal(status.graded);
          this();
        })
        .seq(done);
    });

    it('should update share instances on edit', function(done) {
      var share, share2, inst, inst2;
      Seq()
        .seq(function() {
          Share.post({published: true}, group, user.token, this);
        })
        .seq(function(res) {
          share = res.body;
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          inst = res.body;
          var tmp = _.clone(share, true);
          tmp.displayName = 'aaaaaaaa';
          tmp._object[0].objectType = 'section';
          tmp._object[0].attachments.push({
            objectType: 'post',
            originalContent: 'test'
          });
          Share.updateShare(tmp, user.token, this);
        })
        .seq(awaitHooks)
        .seq(function(res) {
          expect(res.status).to.equal(200);
          share2 = res.body;
          request
            .get('/share/' + share._id + '/instance/' + student._id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          inst2 = res.body;
          expect(share.displayName).to.not.equal(share2.displayName);
          expect(inst.displayName).to.not.equal(inst2.displayName);
          expect(inst2.displayName).to.equal(share2.displayName);
          expect(share._object[0].attachments.length).to.not.equal(share2._object[0].attachments.length);
          expect(inst._object[0].attachments.length).to.not.equal(inst2._object[0].attachments.length);
          expect(share._object[0].attachments.length).to.equal(inst._object[0].attachments.length);
          expect(share2._object[0].attachments.length).to.equal(inst2._object[0].attachments.length);
          this();
        })
        .seq(function() {
          done();
        });
    });
  });

  describe('deleting a share', function() {
    it('should succeed for queued shares', function(done) {
      Seq()
        .seq(function() {
          Share.queue({}, group, user.token, this);
        })
        .seq(function(res) {
          var queued = res.body;
          expect(res).to.have.status(201);
          Share.del(queued._id, user.token, this);
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
        User.createAndLogin({userType: 'student'}, this);
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
        GroupHelper.join(group, studentMember, this);
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
        user.con.post('/share/subscription', {channel: 'group!' + group._id + '.board'}, function() {
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
        [teacher, student, teacherMember, studentMember].forEach(function(user) {
          user.messages = [];
        });
      });

      before(function(done) {
        Seq()
          .seq(function() {
            Share.post({}, group, teacherMember.token, this)
          })
          .seq(function(res) {
            post = res.body;
            this();
          })
          .seq(done);
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
                descriptor: Group.toAbstractKey(group),
                allow: [
                  access.entry('group', 'teacher', Group.toAbstractKey(group)),
                  access.entry('user', 'student', {id: studentMember._id})
                ]
              }],
              channels: ['group!' + group._id + '.board']
            }, group, teacherMember.token, this);
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
      Share.feed('group!' + group._id + '.board', user.token, this)
    })
    .seq(function(res) {
      expect(res.body.items).to.contain.an.item.with.properties({_id: post._id});
      this();
    })
    .seq(done);
}

function checkNotInFeed(user, group, post, done) {
  Seq()
    .seq(function() {
      Share.feed('group!' + group._id + '.board', user.token, this);
    })
    .seq(function(res) {
      var shares = res.body.items;
      expect(shares).to.satisfy(function(shares) {
        return (shares || []).every(function(share) {
          return share._id !== post._id;
        });
      });

      this();
    })
    .seq(done);
}

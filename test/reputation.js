require('./helpers/boot');


var Seq = require('seq')
  , User = require('./helpers/user')
  , Share = require('./helpers/share')
  , GroupHelper = require('./helpers/group')
  , Group = require('lib/Group/model')
  , Cookie = require('cookie')
  , access = require('lib/access');




describe('reputation hooks', function() {
  var teacher, group, student;

  before(function(done) {
    // enable charging
    require('lib/Reputation/hooks').noCharge = false;

    Seq()
      .seq(function() {
        User.createAndLogin(this);
      })
      .seq(function(u) {
        teacher = u;
        request
          .post('/group')
          .send(GroupHelper.generate())
          .set('Authorization', teacher.token)
          .end(this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        group = res.body;
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

  after(function() {
    require('lib/Reputation/hooks').noCharge = true;
  })

  describe('should get user reputation', function() {
    it('when requrested', function(done) {
      Seq()
        .seq(function() {
          User.reputation(teacher, this);
        })
        .seq(function(res) {
          var actor = res.body;
          expect(actor.reputation).to.equal(0);
          this();
        })
        .seq(done);
    })

  });

  describe('should change user reputation', function() {
    var post, comment;
    before(function(done) {
      Seq()
        .seq(function() {
          Share.post({}, group, teacher.token, this);
        })
        .seq(function(res) {
          var share = post = res.body
          comment = Share.child(share, 'comment', function(parent) {
            return parent.path('replies');
          });
          comment._object[0].originalContent = 'test comment';

          Share.postShare(comment, student.token, this);
        })
        .seq(function(res) {
          var self = this;
          comment = res.body;
          // Aggregate channel happens in a post, give it a moment
          setTimeout(function() {
            User.updated(teacher, self);
          }, 500);
        })
        .seq(function(updated) {
          teacher = updated;
          this();
        })
        .seq(done);
    })


    /**
     * must be run all its in order
     */
    it('when student comments', function() {
      expect(teacher.reputation.canonicalTotal.items).to.equal(1);
      expect(teacher.reputation.canonicalTotal.points).to.equal(1);
    });

    it('when teacher changes profile', function(done) {
      Seq()
        .seq(function() {
          User.changeAvatar(teacher, '/originals/decks/lotus.png', this)
        })
        .seq(function() {
          User.updated(teacher, this);
        })
        .seq(function(updated) {
          teacher = updated;
          expect(teacher.reputation.canonicalTotal.items).to.equal(2);
          expect(teacher.reputation.canonicalTotal.points).to.equal(0);
          this();
        })
        .seq(done);
    });

    it('when teacher votes on comment', function(done) {
      Seq()
        .seq(function() {
          var vote = Share.child(comment, 'vote', function(parent) {
            return [parent.object.path('votes')];
          });
          vote._object[0].action = 'up';
          Share.postShare(vote, teacher.token, this);
        })
        .seq(function() {
          // Aggregates are done in a post hook, so give it some time
          // to finish
          var self = this;
          setTimeout(function() {
            User.updated(student, self);
          }, 500);
        })
        .seq(function(updated) {
          student = updated;
          expect(student.reputation.canonicalTotal.items).to.equal(1);
          expect(student.reputation.canonicalTotal.points).to.equal(1);


          var vote = Share.child(comment, 'vote', function(parent) {
            return [parent.object.path('votes')];
          });
          vote._object[0].action = 'down';
          Share.postShare(vote, teacher.token, this);
        })
        .seq(function() {
          // Aggregates are done in a post hook, so give it some time
          // to finish
          var self = this;
          setTimeout(function() {
            User.updated(student, self);
          }, 500);
        })
        .seq(function(updated) {
          student = updated;
          expect(student.reputation.canonicalTotal.items).to.equal(2);
          expect(student.reputation.canonicalTotal.points).to.equal(-1);
          this();
        })
        .seq(done);
    });
  });
});
require('./helpers/boot');

var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group')
  , FormHelper = require('./helpers/form')
  , ShareHelper = require('./helpers/share')
  , Faker = require('Faker')
  , _ = require('lodash')
  , moment = require('moment')
  , url = require('url');



describe('Form controller', function() {

  var teacherToken, teacher, studentToken2, student;
  before(function(done) {
    var teacherPassword;
    Seq()
      .seq(function() {
        teacherPassword = UserHelper.create(this).password;
      })
      .seq(function(res) {
        teacher = res.body
        teacher.password = teacherPassword
        UserHelper.login(teacher.username, teacher.password, this);
      })
      .seq(function(res) {
        teacherToken = 'Bearer ' + res.body.token;
        student = UserHelper.create({userType: 'student'}, this);
      })
      .seq(function(res) {
        student = res.body;
      	UserHelper.login(student.username, student.password, this);
      })
      .seq(function(res) {
      	studentToken = 'Bearer ' + res.body.token;
      	this();
      })
      .seq(done);
  });

  var group;
  beforeEach(function(done) {
    Seq()
      .seq(function() {
        request
          .post('/group')
          .set('Authorization', teacherToken)
          .send(GroupHelper.generate())
          .end(this);
      })
      .seq(function(res) {
        group = res.body;
        GroupHelper.join(group, {token: studentToken}, this);
      })
      .seq(function(res) {
        this();
      })
      .seq(done);
  });

  describe('should create a new form', function() {
  	it('when information is entered properly', function(done) {
  		Seq()
  			.seq(function() {
          FormHelper.create(teacherToken, 'form', {
            contexts: group.id,
            channels: ['group!' + group.id + '.board']
          }, this);
  			})
  			.seq(function(res) {
          var assignment = res.body;
          expect(assignment.actor.id).to.equal(teacher.id);
          expect(assignment.verb).to.equal('assigned');
          expect(assignment.instances.selfLink.indexOf(assignment._id)).to.be.greaterThan(0);
  				this();
  			})
  			.seq(done);
  	});

  });

  describe('should answer question', function() {
    var assignment;
    it('when question is formed properly', function(done) {
      Seq()
        .seq(function() {
          FormHelper.create(teacherToken, 'form', {contexts: group.id, channels: ['group!' + group.id + '.board']}, this);
        })
        .seq(function(res) {
          assignment = res.body;
          FormHelper.getInstance(studentToken, res.body._id, student._id, this);
        })
        .seq(function(res) {
          var inst = res.body;
          var question = inst._object[0].attachments[0].attachments[0];
          expect(question.objectType).to.equal('formQuestion');
          question.response = question.attachments[0]._id;
          ShareHelper.patchShare(inst, studentToken, this);
        })
        .seq(function(res) {
          response = res.body;
          request.get('/share/' + assignment._id)
            .set('Authorization', teacherToken)
            .end(this);
        })
        .seq(function(res) {
          var updated = res.body;
          expect(updated.instances.total.length).to.equal(1);
          var actorsTotal = {};
          actorsTotal[student.id] = {
            actor: {
              displayName: student.displayName,
              id: student.id,
              url: '/' + student.id + '/',
              image: {
                url: student.image.url
              }
            },
            items: 1
          };
          expect(updated.instances.total[0]).to.be.like({
            context: group.id,
            items: 1,
            actors: actorsTotal
          });
          this()
        })
        .seq(function() {
          done();
        })
    });
  });
});
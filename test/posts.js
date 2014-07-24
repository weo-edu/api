var Seq = require('seq');
var Post = require('./helpers/post');
var UserHelper = require('./helpers/user');
var GroupHelper = require('./helpers/group');

require('./helpers/boot');

describe('Post controller', function() {
	var teacher, token, group;
	before(function(done) {
    Seq()
      .seq(function() {
        teacher = UserHelper.create(this);
      })
      .seq(function() {
        UserHelper.login(teacher.username, teacher.password, this);
      })
      .seq(function(res) {
        token = 'Bearer ' + res.body.token;
        this();
      })
      .seq(function() {
      	GroupHelper.create({}, {token: token}, this);
      })
      .seq(function(res) {
      	group = res.body;
      	this();
      })
      .seq(done);
    });


	it('should create post', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'post', {}, [group], this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share._object[0].objectType).to.equal('post');
				expect(share.verb).to.equal('shared');
				this();
			})
			.seq(done);
	});

	it('should create comment', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'comment', {}, [group], this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share._object[0].objectType).to.equal('comment');
				expect(share.verb).to.equal('commented');
				this();
			})
			.seq(done);
	});

	it('should create question', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'question', {}, [group], this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share._object[0].objectType).to.equal('question');
				expect(share.verb).to.equal('asked');
				this();
			})
			.seq(done);
	});

	it('should create answer', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'answer', {}, [group], this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share._object[0].objectType).to.equal('answer');
				expect(share.verb).to.equal('answered');
				this();
			})
			.seq(done);
	});

	describe('should throw error', function() {
		it('when user not authenticated', function(done) {
			var share = Post.generate({}, [group]);
			Seq()
				.seq(function() {
					request
			      .post('/share')
			      .send(share)
			      .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.status(401);
					this();
				})
				.seq(done);
		});

		it('when body is not given', function(done) {
			var share = Post.generate({}, [group]);
			share.object.originalContent = '';
			Seq()
				.seq(function() {
					request
			      .post('/share')
			      .send(share)
			      .set('Authorization', token)
			      .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('_object.0.originalContent', 'required', 'Required if no media', '', 'originalContent');
					this();
				})
				.seq(done);
		});

	});

});
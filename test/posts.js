var Seq = require('seq')
  , Post = require('./helpers/post')
  , UserHelper = require('./helpers/user');


require('./helpers/boot');

describe('Post controller', function() {
	var teacher, token;
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
      .seq(done);
    });


	it('should create post', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'post', {}, this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share.object.type).to.equal('post');
				expect(share.verb).to.equal('shared');
				this();
			})
			.seq(done);
	});

	it('should create comment', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'comment', {}, this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share.object.type).to.equal('comment');
				expect(share.verb).to.equal('commented');
				this();
			})
			.seq(done);
	});

	it('should create question', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'question', {}, this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share.object.type).to.equal('question');
				expect(share.verb).to.equal('asked');
				this();
			})
			.seq(done);
	});

	it('should create answer', function(done) {
		Seq()
			.seq(function() {
				Post.create(token, 'answer', {}, this);
			})
			.seq(function(res) {
				var share = res.body;
				expect(share.object.type).to.equal('answer');
				expect(share.verb).to.equal('answered');
				this();
			})
			.seq(done);
	});

	describe('should throw error', function() {
		it('when user not authenticated', function(done) {
			var post = Post.generate();
			post.type = 'post';
			var share = {to: Post.randomTo()};
			share.post = post;
			Seq()
				.seq(function() {
					request
			      .post('/post')
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
			var share = Post.generate({}, [Post.randomTo()]);
			share.object.originalContent = undefined;
			Seq()
				.seq(function() {
					request
			      .post('/post')
			      .send(share)
			      .set('Authorization', token)
			      .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('object.originalContent', 'required', 'Required if no media', '');
					this();
				})
				.seq(done);
		});

	});

});
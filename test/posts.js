var Seq = require('seq')
  , Post = require('./helpers/post')
  , UserHelper = require('./helpers/user');


require('./helpers/boot');

describe('Post controller', function() {
	it('should create comment', function(done) {
		var post = Post.generate();
		var discussionId = Post.discussionId();
		Seq()
			.seq(function() {
				request
          .post('/comment/' + discussionId)
          .send(post)
          .end(this);
			})
			.seq(function(res) {
				var p = res.body;
				expect(p.type).to.equal('comment');
				expect(p.discussion_id).to.equal(discussionId);
				this();
			})
			.seq(done);
	});

	it('should create question', function(done) {
		var post = Post.generate();
		var discussionId = Post.discussionId();
		Seq()
			.seq(function() {
				request
          .post('/question/' + discussionId)
          .send(post)
          .end(this);
			})
			.seq(function(res) {
				var p = res.body;
				expect(p.type).to.equal('question');
				expect(p.discussion_id).to.equal(discussionId);
				this();
			})
			.seq(done);
	});

	it('should create answer', function(done) {
		var post = Post.generate();
		post.parent_id = '' + Math.random();
		var discussionId = Post.discussionId();
		Seq()
			.seq(function() {
				request
          .post('/answer/' + discussionId)
          .send(post)
          .end(this);
			})
			.seq(function(res) {
				var p = res.body;
				expect(p.type).to.equal('answer');
				expect(p.discussion_id).to.equal(discussionId);
				this();
			})
			.seq(done);
	});

	describe('should throw error', function() {
		it('when user is not given', function(done) {
			var post = Post.generate();
			var discussionId = Post.discussionId();
			delete post.user;
			Seq()
				.seq(function() {
					request
	          .post('/comment/' + discussionId)
	          .send(post)
	          .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('missing_field', 'user', 'comment',
            {rule: 'required'});
					this();
				})
				.seq(done);
		});

		it('when body is not given', function(done) {
			var post = Post.generate();
			var discussionId = Post.discussionId();
			delete post.body;
			Seq()
				.seq(function() {
					request
	          .post('/comment/' + discussionId)
	          .send(post)
	          .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('missing_field', 'body', 'comment',
            {rule: 'required'});
					this();
				})
				.seq(done);
		});

		it('when discussion id is not given', function(done) {
			var post = Post.generate();
			Seq()
				.seq(function() {
					request
	          .post('/comment/')
	          .send(post)
	          .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('missing_field', 'discussion_id', 'comment',
            {rule: 'required'});
					this()
				})
				.seq(done);
		});

		it('when parent id is not given to answer', function(done) {
			var post = Post.generate();
			var discussionId = Post.discussionId();
			Seq()
				.seq(function() {
					request
	          .post('/answer/' + discussionId)
	          .send(post)
	          .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('missing_field', 'parent_id', 'answer',
            {rule: 'required'});
					this()
				})
				.seq(done);
		});

		it('when parent id is not given to question', function(done) {
			var post = Post.generate();
			var discussionId = Post.discussionId();
			delete post.title;
			Seq()
				.seq(function() {
					request
	          .post('/question/' + discussionId)
	          .send(post)
	          .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('missing_field', 'title', 'question',
            {rule: 'required'});
					this()
				})
				.seq(done);
		});
	});

	describe('should find', function() {
		var discussionId = Post.discussionId();
		before(function(done) {
			Seq()
				.seq(function() {
					Post.create('comment', {discussion_id: discussionId}, this);
				})
				.seq(function() {
					Post.create('question', {discussion_id: discussionId}, this);
				})
				.seq(function() {
					Post.create('answer', {parent_id: '' + Math.random(), discussion_id: discussionId}, this);
				})
				.seq(function() {
					done();
				});
		});

		it('a comment', function(done) {
			Seq()
				.seq(function() {
					request
						.get('/comment/' + discussionId)
						.end(this)
				})
				.seq(function(res) {
					var comments = res.body;
					expect(comments[0].type).to.equal('comment');
					done();
				})
		});

		it('a question', function(done) {
			Seq()
				.seq(function() {
					request
						.get('/question/' + discussionId)
						.end(this)
				})
				.seq(function(res) {
					var comments = res.body;
					expect(comments[0].type).to.equal('question');
					done();
				})
		});

		it('a answer', function(done) {
			Seq()
				.seq(function() {
					request
						.get('/answer/' + discussionId)
						.end(this)
				})
				.seq(function(res) {
					var comments = res.body;
					expect(comments[0].type).to.equal('answer');
					done();
				})
		});

	});

});
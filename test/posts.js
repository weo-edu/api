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
				expect(share.object.objectType).to.equal('post');
				expect(share.verb).to.equal('shared');
				this();
			})
			.seq(done);
	});

	describe('should throw error', function() {
		it('when user not authenticated', function(done) {
			var share = Post.generate({}, [Post.randomTo()]);
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
			var share = Post.generate({}, [Post.randomTo()]);
			share.object.content = '';
			Seq()
				.seq(function() {
					request
			      .post('/share')
			      .send(share)
			      .set('Authorization', token)
			      .end(this);
				})
				.seq(function(res) {
					expect(res).to.have.ValidationError('_object.0.content', 'required', 'Required if no media', '', 'content');
					this();
				})
				.seq(done);
		});

	});

});
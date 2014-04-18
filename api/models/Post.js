var Seq = require('seq');

/**
 * Post
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {

    type: {
      type: 'string',
      required: true,
      in: ['question', 'answer', 'comment', 'post']
    },
  	
  	body: {
  		type: 'string'
  	},

  	media: {
      type: 'json',
    }
    
  },

  construct: function(creator, share, post, cb) {

    Seq()
      .seq(function() {
        if (! (post.body || post.media)) {
          var error = {
            ValidationError: {
              body: [
              {
                data: post.body,
                message: 'Validation error: body required',
                rule: 'required',
                args: [true]
              }]
            }
          }
          return this(error);
        }
        validate(Post, post, this);
      })
      .seq(function() {
        Post.mixinShare(share, post);
        Share.createAndEmit(creator, share, cb);
      })
      .catch(function(err) {
        cb(err);
      })
  },

  mixinShare: function(share, post) {
    share.type = 'post';
    switch(post.type) {
      case 'question':
        share.verb = 'asked';
        break;
      case 'answer':
        share.verb = 'answered';
        break;
      case 'comment':
        share.verb = 'commented';
        break;
      case 'post':
        share.verb = 'shared';
        break;
    }
    share.object = post;
  }

};

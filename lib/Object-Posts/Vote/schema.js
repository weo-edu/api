var ObjectSchema = require('lib/Object/schema');

var VoteSchema = module.exports = ObjectSchema.discriminator('vote', {
  post: {
    id: String,
    share: String
  },

  direction: {
    type: String,
  },

  // differnce between this vote and last vote
  points: {
    type: Number,
    default: 0
  },

  displayType: String

});


VoteSchema.method('vote', function(post, points) {
  this.post.id = post.id;
  this.post.share = post.share().root;
  this.displayType = post.objectType;
  this.points = points;
  if (this.points > 0) {
    this.direction = 'up';
  } else if (this.points < 0) {
    this.direction = 'down';
  } else {
    this.direction = 'even';
  }
  this.displayName = 'Voted ' + this.direction + ' ' + post.share().actor.displayName + "'s " + post.objectType;
});

VoteSchema.virtual('url').get(function() {
  return '/share/' + this.post.share;
});
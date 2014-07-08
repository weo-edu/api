var ObjectSchema = require('lib/Object/schema');

var VoteSchema = module.exports = ObjectSchema.discriminator('vote', {
  post: {},
  originalActor: {},

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
  this.attach(post.toJSON());
  this.originalActor = post.share().actor;

  this.displayType = post.objectType;
  this.points = points;
  if (this.points > 0) {
    this.direction = 'up';
  } else if (this.points < 0) {
    this.direction = 'down';
  } else {
    this.direction = 'even';
  }
});

VoteSchema.virtual('url').get(function() {
  return '/share/' + this.root;
});
var ObjectSchema = require('lib/Object/schema');

console.log('vot schema included');

var VoteSchema = module.exports = ObjectSchema.discriminator('vote', {
  post: {
    id: String,
    displayName: String,
  },

  direction: {
    type: Number,
    default: 0
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
  this.post.displayName = post.displayName;
  this.displayType = post.objectType;
  this.points = points;
  if (this.points > 0) {
    this.direction = 1;
  } else if (this.points < 0) {
    this.direction = -1;
  } else {
    this.direction = 0;
  }
});
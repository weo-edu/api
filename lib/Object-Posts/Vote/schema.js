var ObjectSchema = require('lib/Object/schema');
var ShareSchema = require('lib/Share/schema');


var VoteSchema = module.exports = ObjectSchema.discriminator('vote', {
  action: {
    type: String
  },

  displayName: {
    type: String
  },

  // differnce between this vote and last vote
  points: {
    type: Number,
    default: 0
  }

});


VoteSchema.virtual('url').get(function() {
  return '/share/' + this.root;
});

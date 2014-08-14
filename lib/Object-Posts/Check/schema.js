var ObjectSchema = require('lib/Object/schema');
var ShareSchema = require('lib/Share/schema');


var CheckSchema = module.exports = ObjectSchema.discriminator('check', {
  action: {
    type: String
  },

  displayName; {
    type: String
  },

  // differnce between this check value and last check value
  points: {
    type: Number,
    default: 0
  }

});


CheckSchema.virtual('url').get(function() {
  return '/share/' + this.root;
});

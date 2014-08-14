var ObjectSchema = require('lib/Object/schema');
var ShareSchema = require('lib/Share/schema');


var ProfileSchema = module.exports = ObjectSchema.discriminator('profile', {
  displayName; {
    type: String
  }
});

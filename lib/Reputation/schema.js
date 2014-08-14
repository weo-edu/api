var ObjectSchema = require('lib/Object/schema');
var UserSchema = require('lib/User/schema');
var ShareSchema = require('lib/Share/schema');

var ReputationSchema = module.exports = ObjectSchema.discriminator('reputation', {
  points: {
    type: Number,
    default: 0
  },
  // Event that caused repuatation increase
  actor: User.foreignKey.embed(),
  // Event that actor acted upon
  target: Share.foreignKey.embed()

});
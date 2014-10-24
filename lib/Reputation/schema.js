var ObjectSchema = require('lib/Object/schema');
var User = require('lib/User/schema');
var Share = require('lib/Share/schema');


module.exports = ObjectSchema.discriminator('reputation', {
  points: {
    type: Number,
    default: 0
  },
  // Event that caused repuatation increase
  //actor: User.foreignKey.embed(),
  actor: {},
  // Event that actor acted upon
  //target: Share.foreignKey.embed()
  target: {}

});
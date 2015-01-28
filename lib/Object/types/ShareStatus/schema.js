var ObjectSchema = require('lib/Object/schema');


module.exports = ObjectSchema.discriminator('status', {
  status: {
    type: String,
    required: true
  },
  instance: {
    type: Boolean,
    default: false
  }
});
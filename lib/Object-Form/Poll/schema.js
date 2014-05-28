var FormSchema = require('../Form/schema');
var PollSchema = module.exports = FormSchema.discriminator('poll', {
  replies: {
    selfLink: String,
    total: [{
      items: Number,
      board: String
    }]
  }
});

var ObjectSchema = require('lib/Object/schema');
var FormSchema = module.exports = ObjectSchema.extend({
  max_score: {
    type: Number
  },
  reward: {
    type: Number
  }
});

/**
 * payload.{address}.{studentId}
 * @field porgress The student progress on the assignment.
 * @field score The student score on the assignment.
 * @field rewared_claimed Whether the reward for the assignment was claimed.
 */
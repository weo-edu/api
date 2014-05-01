module.exports = function(Schema) {
  var AssignmentSchema = new Schema({
    object: {
      type: {
        default: 'poll',
        enum: ['generic', 'poll', 'quiz']
      },
      max_score: {
        type: Number
      },
      reward: {
        type: Number
      }
    },
    verb: {
      type: String,
      default: 'assigned'
    }

    /**
     * payload.{address}.{studentId}
     * @field porgress The student progress on the assignment.
     * @field score The student score on the assignment.
     * @field rewared_claimed Whether the reward for the assignment was claimed.
     */
  }, {id: true, _id: true});


  return AssignmentSchema;
}
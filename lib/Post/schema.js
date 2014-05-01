module.exports = function(Schema) {

 function mediaOrContentValidation(content) {
  return content || this.media;
 }

  var AssignmentSchema = new Schema({
    object: {
      type: {
        default: 'post',
        enum: ['post', 'answer', 'comment', 'question']
      },
      content: {
        type: 'string',
        validate: [mediaOrContentValidation, 'Required if no media']
      },
      media: {
        type: Schema.Types.Mixed
      }
    },
    verb: {
      type: String,
      default: function() {
        var verb = 'shared';
        switch(this.type) {
          case 'question':
            verb = 'asked';
            break;
          case 'answer':
            verb = 'answered';
            break;
          case 'comment':
            verb = 'commented';
            break;
        }
        return verb;
      }
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
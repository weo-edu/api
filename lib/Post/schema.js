module.exports = function(Schema) {

 function mediaOrContentValidation(content) {
  if (!content && !this.media) {
    return false
  } else {
    return true;
  }
 }

   var PostSchema = new Schema({
    object: {
      type: {
        type: String,
        default: 'post',
        enum: ['post', 'answer', 'comment', 'question']
      },
      content: {
        type: String,
        default: '',
        validate: [mediaOrContentValidation, 'Required if no media', 'required']
      },
      media: {
        type: Schema.Types.Mixed,
      }
    },
    verb: {
      type: String,
      default: 'shared',
      enum: ['asked', 'shared', 'answered', 'commented']
    }

    /**
     * payload.{address}.{studentId}
     * @field porgress The student progress on the assignment.
     * @field score The student score on the assignment.
     * @field rewared_claimed Whether the reward for the assignment was claimed.
     */
  }, {id: true, _id: true});

  // XXX is there a better way to do this?
  PostSchema.pre('save', function(next) {
    var verb = this.verb;
    switch(this.object.type) {
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
    this.verb = verb;
    next();
  });


  return PostSchema;
}
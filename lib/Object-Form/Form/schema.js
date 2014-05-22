var ObjectSchema = require('lib/Object/schema');
var Schema = require('mongoose').Schema;
var FormSchema = module.exports = ObjectSchema.extend({
  progress: {
    selfLink: {
      type: String,
      required: true
    },
    total: [{
      board: Schema.Types.ObjectId, 
      items: {
        type: Number,
        default: 0
      },
      progress: {
        type: Number,
        default: 0
      },
      correct: {
        type: Number,
        default: 0
      }
    }]
  }
});

FormSchema.method('isLeaf', function() {
  return false;
});
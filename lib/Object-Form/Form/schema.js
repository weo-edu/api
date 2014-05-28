var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var Schema = require('mongoose').Schema;
var FormSchema = module.exports = ObjectSchema.extend({
  progress: {
    selfLink: {
      type: String,
      required: true
    },
    total: [selfLink.totalSchema.extend({
      progress: {
        type: Number,
        default: 0
      },
      correct: {
        type: Number,
        default: 0
      }
    })],
  },
  replies: {
    selfLink: String,
    total: [{
      items: Number,
      board: String
    }]
  }
});

FormSchema.method('isLeaf', function() {
  return false;
});
var validations = require('lib/validations');

module.exports = function(Schema) {
  var GroupSchema = new Schema({
    type: {
      type: String,
      default: 'class',
      enum: ['class', 'group']
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'archived']
    },
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      unique: true,
      required: true
    },
    owners: {
      type: [{type: Schema.Types.ObjectId, ref: 'Teacher'}],
      required: true
    }
  });

  return GroupSchema;
};
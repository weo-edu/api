var validations = require('lib/validations')
  , access = require('lib/access');

module.exports = function(Schema) {
  var GroupSchema = new Schema({
    groupType: {
      type: String,
      default: 'class',
      enum: ['class', 'group']
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'archived']
    },
    displayName: {
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
    },
    access: {
      allow: {
        type: [String]
      },
      deny: {
        type: String
      }
    }
  });

  GroupSchema.pre('validate', function(next) {
    if (!this.access || !this.access.allow.length) {
      this.access.allow = [access.entry('public', 'teacher'), access.entry('group', 'student', this.id)];
    }
    next();
  })

  return GroupSchema;
};
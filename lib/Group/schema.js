var validations = require('lib/validations');

module.exports = function(Schema) {
  var GroupSchema = new Schema({
    type: {
      type: String,
      validate: [
        validations.whitelist('class', 'group', 'class'),
        'Group type must be chosen from the allowable list'
      ],
    },
    status: {
      type: String,
      default: 'active',
      validate: [
        validations.whitelist('active', 'archived'),
        'Group status must be an allowabletype'
      ]
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
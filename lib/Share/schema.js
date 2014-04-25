var validations = require('lib/validations');

module.exports = function(Schema) {
  var EntitySchema = {
    id: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      required: true,
      type: String
    },
    link: {
      required: true,
      type: String
    },
    avatar: String
  };

  var ShareSchema = new Schema({
    to: {
      type: Array,
      required: true
    },
    actor: EntitySchema,
    verb: {
      type: String,
      required: true
    },
    object: {},
    type: {
      type: String,
      required: true
    },
    visibility: String,
    published_at: Date,
    status: {
      type: String,
      validate: [validations.whitelist('active', 'pending'), 'Must have valid status'],
      default: 'active',
      required: true
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    }
  });

  return ShareSchema;
};
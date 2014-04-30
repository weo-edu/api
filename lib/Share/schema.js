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

  var ToSchema = new Schema({});

  var ShareSchema = new Schema({
    to: {
      type: [ToSchema],
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
      enum: ['active', 'pending'],
      default: 'active',
      required: true
    },
    payload: {}
  });

  return ShareSchema;
};
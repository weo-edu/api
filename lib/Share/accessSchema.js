var validations = require('lib/validations');


module.exports = function(Schema) {
  var AccessSchema = new Schema({
    id: {
      type: String,
      validate: [
        {validator: typeIdValidation, msg: 'Type expects id to be set'}
      ]
    },
    role: {
      type: String,
      required: true,
      enum: ['teacher', 'student']
    },
    type: {
      type: String,
      required: true,
      enum: ['public', 'group', 'user']
    }
  }, {_id: false});

  function typeIdValidation(id) {
    if ((this.type === 'group' || this.type === 'user') && !id)
      return false;
    else
      return true;
  }
  return AccessSchema;
};

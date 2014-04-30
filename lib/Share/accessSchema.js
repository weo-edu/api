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
      validate: [validations.whitelist('teacher', 'student'), 'Must be a valid role']
    },
    type: {
      type: String,
      required: true,
      validate: [
        {validator: validations.whitelist('public', 'group', 'user'), msg: 'Must be a valid type'}
      ]
    }
  }, {_id: false});

  function typeIdValidation(id) {
    if ((this.type === 'group' || this.type === 'user') && !id)
      return false
    else {
      return true;
    }
  }
  return AccessSchema;
};

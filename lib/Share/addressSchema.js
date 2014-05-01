var validations = require('lib/validations');

module.exports = function(Schema) {
  var AccessSchema = require('./accessSchema')(Schema);
  var AddressSchema = new Schema({
    id: {
      type: String,
      required: true
    },
    access: [AccessSchema]
  }, {_id: false});
  return AddressSchema;
}
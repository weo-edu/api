var validations = require('lib/validations');

module.exports = function(Schema) {
  var StudentSchema = new Schema({}, {id: true, _id: true});

  return StudentSchema;
};
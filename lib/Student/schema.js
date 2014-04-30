var validations = require('lib/validations');

module.exports = function(Schema) {
  var StudentSchema = new Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      match: [
        /[a-zA-Z0-9]*/,
        'Username may only contain letters and numbers',
        'alphanumeric'
      ]
    }
  }, {id: true, _id: true});

  return StudentSchema;
};
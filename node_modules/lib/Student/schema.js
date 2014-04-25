var validations = require('lib/validations');

module.exports = function(Schema) {
  var StudentSchema = new Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      match: [/[a-zA-Z0-9]*/, 'Username may only contain letters and numbers']
    }
  }, {id: true, _id: true});

  StudentSchema.path('username').index({unique: true});
  // We have to do a custom username validation to get it to throw
  // as a ValidationError rather than a MongoError
  StudentSchema.path('username').validate(function(value, done) {
    if(this.isModified('username')) {
      this.model('User').count({username: value}, function(err, count) {
        if(err) return done(err);
        done(! count);
      });
    } else
      done(true);

  }, 'Username already exists');
  return StudentSchema;
};
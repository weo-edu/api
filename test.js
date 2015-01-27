var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('localhost');

var SubSchema = new Schema({str: String});
SubSchema.path('str').validate(function(val, next) {
  console.log('path.validate');
  next();
});

SubSchema.pre('validate', function(next) {
  console.log('pre validate');
  next();
});

var DocSchema = new Schema({arr: [SubSchema]});
var Doc = mongoose.model('b', DocSchema);

var p = new Doc();
p.arr.push({str: 'asdf'});
p.save();
var mongoose = require('mongoose');
var TeacherSchema = require('./schema')(mongoose.Schema);

var User = require('lib/User').model;
TeacherSchema.path('email').index({unique: true, sparse: true});
module.exports = User.discriminator('teacher', TeacherSchema);

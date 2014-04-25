var mongoose = require('mongoose');
var TeacherSchema = require('./schema')(mongoose.Schema);
// Inherit from user
var User = require('lib/User').model;

module.exports = User.discriminator('teacher', TeacherSchema);



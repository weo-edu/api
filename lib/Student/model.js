var StudentSchema = require('./schema');


var User = require('lib/User').model;
module.exports = User.discriminator('student', StudentSchema);

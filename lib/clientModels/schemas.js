var _ = require('lodash');
module.exports = {
  Group: require('lib/Group/schema'),
  User: require('lib/User/schema'),
  Student: require('lib/Student/schema'),
  Teacher: require('lib/Teacher/schema'),
  S3: require('lib/S3/schema')
};

_.extend(module.exports, require('lib/Object-Posts/schema'));
_.extend(module.exports, require('lib/Object-Form/schema'));

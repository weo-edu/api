var knox = require('knox');
var avatarConfig = require('lib/config').s3.avatar;
module.exports = knox.createClient(avatarConfig);
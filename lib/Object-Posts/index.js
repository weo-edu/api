module.exports = {};

require('./Post');
require('./Comment');
require('./Vote');
require('./Section');

require('lib/Object').model.schema;

// Post Attachments
require('./attachments');

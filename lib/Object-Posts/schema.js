var _ = require('lodash');
exports.Answer = require('./Answer/schema');
exports.Comment = require('./Comment/schema');
exports.Question = require('./Question/schema');
exports.Post = require('./Post/schema');
_.extend(module.exports, require('./attachments'));
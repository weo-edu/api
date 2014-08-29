var _ = require('lodash');
exports.Answer = require('./Answer/schema');
exports.Comment = require('./Comment/schema');
exports.Post = require('./Post/schema');
exports.Vote = require('./Vote/schema');
_.extend(module.exports, require('./attachments'));
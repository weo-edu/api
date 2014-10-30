var _ = require('lodash');
exports.Comment = require('./Comment/schema');
exports.Post = require('./Post/schema');
exports.Vote = require('./Vote/schema');
exports.Annotation = require('./Annotation/schema');
exports.Section = require('./Section/schema');
_.extend(module.exports, require('./attachments'));
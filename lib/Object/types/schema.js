var _ = require('lodash');
exports.Comment = require('./Comment/schema');
exports.Post = require('./Post/schema');
exports.Vote = require('./Vote/schema');
exports.Annotation = require('./Annotation/schema');
exports.Section = require('./Section/schema');
exports.Status = require('./ShareStatus/schema');
_.extend(exports, require('./Media/schema'));
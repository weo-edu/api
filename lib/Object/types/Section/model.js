var SectionSchema = require('./schema');
var _ = require('lodash');

SectionSchema.method('grade', function() {
  var points = _.reduce(this.attachments, function(memo, object) {
    if (object.points && object.isGradable && object.isGradable()) {
      memo.max += object.points.max;
      memo.raw += Math.round(object.points.max * (object.points.scaled || 0) * 100) / 100;
    }
    return memo;
  }, {max: 0, raw: 0});

  this.points.max = points.max;
  this.points.scaled = points.max
    ? points.raw / points.max
    : 0;
});

SectionSchema.plugin(require('lib/schema-plugin-was-modified'));
module.exports = {schema: SectionSchema};
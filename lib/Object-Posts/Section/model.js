var SectionSchema = require('./schema');
var _ = require('lodash');

SectionSchema.method('grade', function() {
  var points = _.reduce(this.attachments, function(memo, object) {
    if (object.points && object.isGradable && object.isGradable()) {
      memo.max += object.points.max;
      memo.raw += Math.round(object.points.max * object.points.scaled * 100) / 100;
    }
    return memo;
  }, {max: 0, raw: 0});

  this.points.max = points.max;
  this.points.scaled = points.raw / points.max;

  
});


module.exports = {schema: SectionSchema};
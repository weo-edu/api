var SectionSchema = require('./schema');
var _ = require('lodash');

SectionSchema.method('grade', function() {
  var numPoints = 0;
  var points = _.reduce(this.attachments, function(memo, object) {
    if (object.points) {
      memo.max += object.points.max;
      memo.scaled += object.points.scaled;
      numPoints ++;
    }
    return memo;
  }, {max: 0, scaled: 0});
  if (numPoints)
    points.scaled /= numPoints;

  _.extend(this.points, points);
});


module.exports = {schema: SectionSchema};
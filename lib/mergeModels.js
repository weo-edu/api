var _ = require('lodash');

module.exports = function(/* ... */) {
  var args = _.toArray(arguments);
  args.unshift({});
  args.push(function(a, b) {
    return _.isArray(a)
      ? b
      : undefined;
  });

  return _.merge.apply(_, args);
};
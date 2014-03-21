var idx = 0;

var Group = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    return _.extend({}, {
      name: 'Test Group ' + (idx++),
      type: 'class'
    }, opts);
  }
};
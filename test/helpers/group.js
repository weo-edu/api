var Group = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    return _.extend({}, {
      name: 'Test Group',
      type: 'class'
    }, opts);
  }
};
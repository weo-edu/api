var Group = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    return _.extend({}, {
      name: 'Test Group',
      type: 'class'
    }, opts);
  },
  create: function(opts, cb) {
    if('function' === typeof opts) {
      cb = opts;
      opts = {};
    }
    opts = Group.generate(opts);
    request
      .post('/group')
      .send(opts)
      .end(cb);
    return opts;
  }
};
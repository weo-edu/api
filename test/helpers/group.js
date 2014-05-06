var idx = 0;

var Group = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    return _.extend({}, {
      name: 'Test Group ' + (idx++),
      type: 'class'
    }, opts);
  },
  addMember: function(group, user, cb) {
    request
      .put('/group/' + group.id + '/members')
      .set('Authorization', user.token)
      .end(cb);
  },
  join: function(group, user, cb) {
    request
      .put('/group/join/' + group.code)
      .set('Authorization', user.token)
      .end(cb);
  }
};
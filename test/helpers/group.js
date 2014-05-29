var idx = 0;

var Group = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    return _.extend({}, {
      displayName: 'Test Group ' + (idx++),
      groupType: 'class'
    }, opts);
  },
  addMember: function(group, user, token, cb) {
    request
      .put('/group/' + group.id + '/members/' + user)
      .set('Authorization', token)
      .end(cb);
  },
  join: function(group, user, cb) {
    request
      .put('/group/join/' + group.code)
      .set('Authorization', user.token)
      .end(cb);
  }
};
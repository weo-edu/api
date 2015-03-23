var mu = require('mu');
var svcUser = require('lib/mu-user');

exports.create = function *() {
  this.body = yield mu.request(svcUser).post('/', this.body);
};

exports.get = function *(id) {
  this.body = yield mu.request(svcUser).get(`/${id}`);
};
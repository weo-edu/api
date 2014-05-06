var routify = require('routification');
var app = require('./app');

module.exports = function() {
  return routify(app());
}
const mu = require('mu-js');
const route = require('mu-route');
const app = module.exports = mu.service();
const actions = require('./actions');

require('lib/mu-crud')(app, actions);
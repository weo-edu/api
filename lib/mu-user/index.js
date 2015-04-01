let mu = require('mu-js');
let route = require('mu-route');
let app = module.exports = mu.service();
let actions = require('./actions');

require('lib/mu-crud')(app, actions);

app.use('/similar-username/:username'
  , actions.similarUsername);
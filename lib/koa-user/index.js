var app = module.exports = require('koa')();
var _ = require('koa-route');
var actions = require('./actions');

app.use(_.post('/')
  , actions.create);

app.use(_.get('/:id'
  , actions.get));




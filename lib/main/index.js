var app = module.exports = require('koa')();
var mount = require('koa-mount');

app.use(mount('/auth', require('lib/auth')));
app.use(mount('/user', require('lib/user')));
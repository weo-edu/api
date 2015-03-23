var app = module.exports = require('koa')();
var mount = require('koa-mount');
var config = require('lib/config');

app.use(mount('/', require('lib/main'));

app.listen(config.port);
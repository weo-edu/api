var express = require('express');
var app = module.exports = express();
app.model = require('./model');

/**
 * Express App
 */

app.use(require('lib/Object'));



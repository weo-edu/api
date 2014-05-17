var express = require('express');
var app = module.exports = express();
app.model = require('./model');
app.use(require('../Form'));
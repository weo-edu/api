var express = require('express');
var app = module.exports = express();
var object = require('lib/Object');
app.model = require('./model');
app.use(object);




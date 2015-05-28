/**
 * Modules
 */

var express = require('express');

/**
 * Libs
 */

var actions = require('./actions');
var pageToken = require('lib/page-token');
var user = require('lib/User');

/**
 * Expose app
 */

var app = module.exports = express();

app.get('/shares', 
  user.middleware.me(),
  pageToken(),
  actions.getShares
);

app.get('/boards',
  pageToken(),
  actions.getBoards
);

app.get('/people',
  pageToken(),
  actions.getPeople
);
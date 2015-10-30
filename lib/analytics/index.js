var Analytics = require('analytics-node')
var SEGMENT_API_KEY = require('lib/config').segment

module.exports =  new Analytics(SEGMENT_API_KEY)

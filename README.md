[![Build Status](https://drone.io/github.com/weo-edu/api/status.png)](https://drone.io/github.com/weo-edu/api/latest)
[![Coverage Status](https://s3-us-west-1.amazonaws.com/misc.eos.io/api/badge.png)](https://s3-us-west-1.amazonaws.com/misc.eos.io/api/coverage/lcov-report/index.html)
## Time Policy

- times are stored as ISODates in UTC
- only server should use `new Date`
- canonical time of day is 12:00 PM
- clients wanting to use relative times should pass timezone and offset to server


## Cron Jobs

- use heroku scheduler
- tasks should lift sails and issue api requests in the same way that tests do


## Database Upgrade Policy

- limit of $250/month for mongoHQ
- switch from mongoHQ to EC2


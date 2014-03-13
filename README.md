[![Build Status](https://drone.io/github.com/weo-edu/api/status.png)](https://drone.io/github.com/weo-edu/api/latest)
[![Coverage Status](https://coveralls.io/repos/weo-edu/api/badge.png)](https://coveralls.io/r/weo-edu/api)

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


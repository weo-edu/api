## Time Policy

- times are stored as ISODates in UTC
- only server should use `new Date`
- cononical time of day is 12:00 PM
- clients wanting to use relative times should pass timezone and offset to server


## Cron Jobs

- use heroku scheduler
- tasks should lift sails and issue api requests in the same way that tests do


## Database Upgrade Policy

- limit $250/month for hosted


[![Build Status](https://drone.io/github.com/weo-edu/api/status.png)](https://drone.io/github.com/weo-edu/api/latest)
[![Coverage Status](https://s3-us-west-1.amazonaws.com/misc.eos.io/api/badge.png)](https://s3-us-west-1.amazonaws.com/misc.eos.io/api/lcov-report/index.html)
## Time Policy

- times are stored as ISODates in UTC
- only server should use `new Date`
- canonical time of day is 12:00 PM
- clients wanting to use relative times should pass timezone and offset to server


## Share

|Property|Value|Description|
|type|string|type of share|
|created_at|datetime|the time at which the share was created|
|updated_at|datetime|the time at which the share was last edited|
|published_at|datetime|the time at which the share was posted|
|id|string|id of share|
|actor|object|the person who posted the share|
|actor.id|string|id of user|
|actor.name|string|display name|
|actor.avatar|string|url of avatar|
|actor.link|string|url of user profile|
|verb|string|indicates which activity was performed|
|object|object|the object of the activity|
|object.type|string|sub type of share|
|to|object|receivers of share|
|to.namespace|string|namespace of share|
|to.groups[]|list|list of groups to share with|
|to.groups[].id|string|id of group|
|to.groups[].domains[]|list|list of domains: `all`,`teacher`, `student`,`thisTeacher`,`thisStudent`,`[studentId]`


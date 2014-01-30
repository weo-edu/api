function ISODate(date) {
  return new Date(date);
}

function ObjectId(objectId) {
  return objectId;
}

module.exports = {
  user: [
    {
      "type" : "teacher",
      "first_name" : "Michele",
      "last_name" : "Harber",
      "groups" : [
        "notARealGroupId"
      ],
      "username" : "Taya",
      "password" : "sha256$05a7fc4f9a6a2e71$5$f6bdc333b84219aea70aa95f976e925b724b91027906a2cf03057f8b795845c1",
      "email" : "Jaylon.Kirlin@keaton.info",
      "createdAt" : ISODate("2014-01-29T23:19:08.821Z"),
      "updatedAt" : ISODate("2014-01-29T23:19:08.821Z"),
      "_id" : ObjectId("52e98c6c34075e6a8554ead1")
    }
  ]
}
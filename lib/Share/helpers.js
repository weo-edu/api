var helpers = module.exports = {};

helpers.userAddressQuery = function(board, user) {
  return {
    to: {$elemMatch: {
      board: board,
      allow: {$in: user.access(board)}
    }}
  };
};


helpers.query = function(boards, user, channel, text) {
  if (channel === '*')
    channel = undefined;
  else if (!channel)
    channel = null;
  var query = {
    $or: boards.map(function(board) {
      return helpers.userAddressQuery(board, user);
    })
  };
  if (channel !== undefined)
    query.channel = channel;
  if (text) {
    query.$text = {$search: text};
  }
  return query;
};

helpers.parseChannel = function(channel) {
  var channelS = channel.split('.');
  return {
    channel: channel,
    share: channelS[0],
    leaf: channelS[channelS.length - 2],
    property: channelS[channelS.length - 1]
  };
};


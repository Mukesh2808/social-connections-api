const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

exports.createUser = asyncHandler(async (req, res) => {
  const newUser = await User.create(req.body);
  res.status(201).json(newUser);
});

exports.getFriends = asyncHandler(async (req, res) => {
  const friends = await User.getFriends(req.params.user_str_id);
  res.json(friends);
});

exports.getFriendsOfFriends = asyncHandler(async (req, res) => {
    const fof = await User.getFriendsOfFriends(req.params.user_str_id);
    res.json(fof);
});

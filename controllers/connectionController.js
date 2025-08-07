const Connection = require('../models/Connection');
const { asyncHandler } = require('../middleware/errorHandler');

exports.createConnection = asyncHandler(async (req, res) => {
  const { user1_str_id, user2_str_id } = req.body;
  await Connection.create(user1_str_id, user2_str_id);
  res.status(201).json({ status: 'connection_added' });
});

exports.removeConnection = asyncHandler(async (req, res) => {
    const { user1_str_id, user2_str_id } = req.body;
    await Connection.remove(user1_str_id, user2_str_id);
    res.json({ status: 'connection_removed' });
});


exports.getDegree = asyncHandler(async (req, res) => {
  const { from_user_str_id, to_user_str_id } = req.query;
  const result = await Connection.calculateDegree(from_user_str_id, to_user_str_id);
  res.json(result);
});
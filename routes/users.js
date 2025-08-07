const router = require('express').Router();
const userCtrl = require('../controllers/userController');
const {
  validateCreateUser,
  validateUserParam
} = require('../middleware/validation');

// POST /api/users
router.post('/', validateCreateUser, userCtrl.createUser);

// GET /api/users/:user_str_id/friends
router.get('/:user_str_id/friends', validateUserParam, userCtrl.getFriends);

// GET /api/users/:user_str_id/friends-of-friends
router.get('/:user_str_id/friends-of-friends', validateUserParam, userCtrl.getFriendsOfFriends);

module.exports = router;

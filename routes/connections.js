const router = require('express').Router();
const connCtrl = require('../controllers/connectionController');
const {
  validateCreateConnection,
  validateDegreeQuery
} = require('../middleware/validation');

// Add this route for degree of separation!
router.get('/degree', validateDegreeQuery, connCtrl.getDegree);

router.post('/', validateCreateConnection, connCtrl.createConnection);
router.delete('/', validateCreateConnection, connCtrl.removeConnection);

module.exports = router;

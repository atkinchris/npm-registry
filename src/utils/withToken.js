const expressJwt = require('express-jwt')

const config = require('../config.js')

module.exports = expressJwt({ secret: config.secret })

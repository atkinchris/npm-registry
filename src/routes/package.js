const express = require('express')
const proxy = require('express-http-proxy')

const config = require('../config.js')

const router = express.Router()
const proxyUpstream = proxy(config.upstream)

router.get('/:package', (req, res, next) => {
  console.log(req.params.package)
  return proxyUpstream(req, res, next)
})

module.exports = router

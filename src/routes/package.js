const express = require('express')
const proxy = require('express-http-proxy')

const config = require('../config.js')
const withToken = require('../utils/withToken')
const registry = require('../registry')

const router = express.Router()
const proxyUpstream = proxy(config.upstream)

router.get('/:package', (req, res, next) => {
  console.log(req.params.package)
  return proxyUpstream(req, res, next)
})

router.put('/:package', withToken, async (req, res) => {
  const pkg = req.body

  try {
    const newPkgManifest = await registry.addPackage(pkg)
    res.status(200).json(newPkgManifest)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

module.exports = router

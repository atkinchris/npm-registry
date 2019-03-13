const express = require('express')
const proxy = require('express-http-proxy')

const config = require('../config.js')
const withToken = require('../utils/withToken')
const streamTarball = require('../utils/streamTarball')
const { RegistryLogicError } = require('../utils/errors')
const registry = require('../registry')

const router = express.Router()
const proxyUpstream = proxy(config.upstream)

router.get('/:pkgName', async (req, res, next) => {
  const { pkgName } = req.params

  if (await registry.hasPackage(pkgName)) {
    const manifest = await registry.getManifest(pkgName)
    return res.json(manifest)
  }

  return proxyUpstream(req, res, next)
})

router.get('/:scope?/:name/-/:scope?/:filename', (req, res) => {
  streamTarball(req.params).pipe(res)
})

router.put('/:package', withToken, async (req, res) => {
  const pkg = req.body

  try {
    const newPkgManifest = await registry.addPackage(pkg)
    res.status(200).json(newPkgManifest)
  } catch (err) {
    if (err instanceof RegistryLogicError) {
      res.status(400).json({ error: err.message })
      return
    }

    throw err
  }
})

module.exports = router

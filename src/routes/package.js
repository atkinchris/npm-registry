const express = require('express')
const proxy = require('express-http-proxy')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs-extra')

const config = require('../config.js')
const withToken = require('../utils/withToken')

const router = express.Router()
const proxyUpstream = proxy(config.upstream)

router.get('/:package', (req, res, next) => {
  console.log(req.params.package)
  return proxyUpstream(req, res, next)
})

router.put('/:package', withToken, async (req, res) => {
  const pkg = req.body
  const { _attachments: attachments, name, versions, 'dist-tags': distTags } = pkg

  const tags = Object.keys(distTags)
  const tag = tags[0]

  if (tags.length !== 1 || !tag) {
    res.status(400).json({ error: 'Package must have 1 dist-tag' })
    return
  }

  const storageFolder = 'storage'
  const pkgFolder = `${storageFolder}/${name}`

  // eslint-disable-next-line no-restricted-syntax
  for (const [filename, attachment] of Object.entries(attachments)) {
    const data = Buffer.from(JSON.stringify(attachment.data), 'base64')

    const hash = crypto.createHash('sha1')
    hash.update(data)
    const sha = hash.digest('hex')
    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const tarballFolder = path.join(pkgFolder, baseName)
    const tarballPath = path.join(tarballFolder, `${sha}${ext}`)

    await fs.mkdirp(tarballFolder)
    await fs.writeFile(tarballPath, data, {
      'Content-Type': attachment.content_type,
      'Content-Length': attachment.length,
    })
  }

  const pkgDefinition = {
    name,
    versions: {
      ...versions,
    },
    'dist-tags': {
      ...distTags,
    },
  }
  const pkgPath = path.join(pkgFolder, 'manifest.json')
  await fs.writeFile(pkgPath, JSON.stringify(pkgDefinition, null, '\t'))

  const registry = [name]
  const registryPath = path.join(storageFolder, 'registry.json')
  await fs.writeFile(registryPath, JSON.stringify(registry, null, '\t'))

  res.status(200).json(pkgDefinition)
})

module.exports = router

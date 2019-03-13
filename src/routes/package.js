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

  const tags = Object.keys(pkg['dist-tags'])
  const tag = tags[0]

  if (tags.length !== 1 || !tag) {
    res.status(400).json({ error: 'Package must have 1 dist-tag' })
    return
  }

  const { _attachments: attachments, name } = pkg

  // eslint-disable-next-line no-restricted-syntax
  for (const [filename, attachment] of Object.entries(attachments)) {
    const data = Buffer.from(JSON.stringify(attachment.data), 'base64')

    const hash = crypto.createHash('sha1')
    hash.update(data)
    const sha = hash.digest('hex')
    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const tarballPath = `storage/${name}/${baseName}`
    const tarballName = `${sha}${ext}`

    await fs.mkdirp(tarballPath)
    await fs.writeFile(path.join(tarballPath, tarballName), data, {
      'Content-Type': attachment.content_type,
      'Content-Length': attachment.length,
    })
  }

  res.status(200).json(pkg)
})

module.exports = router

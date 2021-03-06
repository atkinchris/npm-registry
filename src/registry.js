/* eslint-disable class-methods-use-this */
const fs = require('fs-extra')
const path = require('path')

const { storageFolder } = require('./config')
const { RegistryLogicError } = require('./utils/errors')

const EMPTY_REGISTRY = {}
const registryPath = path.join(storageFolder, 'registry.json')

const getPkgPath = pkgName => path.join(storageFolder, pkgName)
const getManifestPath = pkgName => path.join(getPkgPath(pkgName), 'manifest.json')
const onNotExisting = response => err => {
  if (err.code === 'ENOENT') return response
  throw err
}

class Registry {
  async getRegistry() {
    if (this.cachedRegistry) {
      return this.cachedRegistry
    }

    return fs.readJson(registryPath).catch(onNotExisting(EMPTY_REGISTRY))
  }

  async setRegistry(registry) {
    await fs.mkdirp(path.dirname(registryPath))
    await fs.writeJson(registryPath, registry, { spaces: '\t' })

    this.cachedRegistry = registry
  }

  async getManifest(pkgName) {
    return fs.readJson(getManifestPath(pkgName)).catch(onNotExisting(null))
  }

  async setManifest(pkgName, manifest) {
    const manifestPath = getManifestPath(pkgName)
    await fs.mkdirp(path.dirname(manifestPath))
    await fs.writeJSON(manifestPath, manifest, { spaces: '\t' })
  }

  async hasPackage(pkgName) {
    const registry = await this.getRegistry()
    return !!registry[pkgName]
  }

  async addPackage(pkg) {
    const { _attachments: attachments, 'dist-tags': distTags } = pkg
    const tags = Object.keys(distTags)
    const tag = tags[0]

    if (tags.length !== 1 || !tag) {
      throw new RegistryLogicError('Package must have 1 dist-tag')
    }

    const existingManifest = await this.getManifest(pkg.name)
    const newManifest = {
      ...pkg,
    }

    if (existingManifest) {
      const version = distTags[tag]

      if (existingManifest.versions[version]) {
        throw new RegistryLogicError(`Package version ${version} is already published`)
      }

      newManifest.versions = { ...existingManifest.versions, ...pkg.versions }
      newManifest['dist-tags'] = { ...existingManifest['dist-tags'], ...pkg['dist-tags'] }
    }

    const packagePath = getPkgPath(pkg.name)
    // eslint-disable-next-line no-restricted-syntax
    for (const [filename, attachment] of Object.entries(attachments)) {
      const data = Buffer.from(JSON.stringify(attachment.data), 'base64')
      const tarballPath = path.join(packagePath, '-', filename)

      await fs.mkdirp(path.dirname(tarballPath))
      await fs.writeFile(tarballPath, data, {
        'Content-Type': attachment.content_type,
        'Content-Length': attachment.length,
      })
    }

    await this.setManifest(pkg.name, newManifest)

    const registry = await this.getRegistry()
    registry[pkg.name] = true
    await this.setRegistry(registry)

    return newManifest
  }
}

module.exports = new Registry()

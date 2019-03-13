const fs = require('fs')
const path = require('path')

const { storageFolder } = require('../config')

module.exports = ({ scope, name, filename }) => {
  const tarballPath = path.join(storageFolder, scope, name, '-', scope, filename)
  return fs.createReadStream(tarballPath)
}

const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const config = require('../config.js')
const withToken = require('../utils/withToken')

const router = express.Router()

const areCredentialsValid = async ({ name, password }) => {
  const userRecord = config.users.find(u => u.startsWith(`${name}:`))
  if (!userRecord) return false

  const hashRegex = /^.*:(\$.+)$/
  const hash = hashRegex.exec(userRecord)[1]

  if (!hash) {
    throw Error(`Hash for user ${name} is not present or malformed`)
  }

  const validPassword = await bcrypt.compare(password, hash)

  return validPassword
}

router.post('/-/v1/login', (_, res) => res.sendStatus(401))

router.put('/-/user/:user', async (req, res) => {
  const { name, password } = req.body
  const valid = await areCredentialsValid({ name, password })

  if (!valid) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }

  const token = jwt.sign({ username: name }, config.secret, { noTimestamp: true })
  res.status(201).json({ token })
})

router.get('/-/whoami', withToken, (req, res) => res.json(req.user))

module.exports = router

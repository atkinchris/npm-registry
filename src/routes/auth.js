const express = require('express')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')

const config = require('../config.js')

const router = express.Router()
const withToken = expressJwt({ secret: config.secret })

router.post('/-/v1/login', (_, res) => res.sendStatus(401))

router.put('/-/user/:user', (req, res) => {
  const { name, password } = req.body

  if (name !== password) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }

  const token = jwt.sign({ username: name }, config.secret, { noTimestamp: true })
  res.status(201).json({ token })
})

router.get('/-/whoami', withToken, (req, res) => res.json(req.user))

module.exports = router

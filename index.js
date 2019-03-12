const express = require('express')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const jwt = require('jsonwebtoken')
const proxy = require('express-http-proxy')

const config = {
  secret: 'chris',
  upstream: 'https://registry.npmjs.org/',
}

const app = express()
app.use(bodyParser.json())
const port = 3000
const withToken = expressJwt({ secret: config.secret })
const proxyUpstream = proxy(config.upstream)

app.post('/-/v1/login', (_, res) => res.sendStatus(401))

app.put('/-/user/:user', (req, res) => {
  const { name, password } = req.body

  if (name !== password) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }

  const token = jwt.sign({ username: name }, config.secret, { noTimestamp: true })
  res.status(201).json({ token })
})

app.get('/-/whoami', withToken, (req, res) => res.json(req.user))

app.post('/-/npm/v1/security/audits', (_, res) => res.sendStatus(501))
app.post('/-/npm/v1/security/audits*', (_, res) => res.sendStatus(501))

app.get('/:package', (req, res, next) => {
  console.log('Getting package')
  return proxyUpstream(req, res, next)
})

app.all('*', (req, res) => {
  console.log('Unhandled request')
  console.log(req.method, req.originalUrl, req.body, req.headers)
  res.sendStatus(501)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

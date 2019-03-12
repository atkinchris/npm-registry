const express = require('express')
const bodyParser = require('body-parser')

const authRoutes = require('./routes/auth')
const packageRoutes = require('./routes/package')
const config = require('./config')

const app = express()
app.use(bodyParser.json())

app.use(authRoutes)
app.use(packageRoutes)

app.all('*', (req, res) => {
  console.log('Unhandled request')
  console.log(req.method, req.originalUrl, req.body, req.headers)
  res.sendStatus(501)
})

const listener = app.listen(config.port, () => {
  console.log(`📦 Registry listening on port ${listener.address().port}`)
})

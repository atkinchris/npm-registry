const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
const port = 3000

app.post('/-/v1/login', (req, res) => {
  if (!(req.body && req.body.username)) {
    res.sendStatus(401)
    return
  }

  res.sendStatus(200)
})

app.put('/-/user/:user', (req, res) => {
  const { name, password } = req.body

  if (name === password) {
    res.status(201).json({ token: 'atkinchris--token' })
  } else {
    res.status(401).json({ error: 'invalid credentials' })
  }
})

app.all('*', (req, res) => {
  console.log(req.method, req.originalUrl, req.body, req.headers)
  res.send('Hello World!')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

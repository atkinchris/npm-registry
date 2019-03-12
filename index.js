const express = require('express')

const app = express()
const port = 3000

app.all('*', (req, res) => {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  console.log(url)
  res.send('Hello World!')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

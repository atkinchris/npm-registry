const express = require('express')

const router = express.Router()

router.post('/-/npm/v1/security/audits*', (_, res) => res.sendStatus(501))
router.post('/-/npm/v1/security/audits', (_, res) => res.sendStatus(501))

module.exports = router

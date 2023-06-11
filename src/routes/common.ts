import { Router } from 'express'
import * as t from 'io-ts'

import { TW_COOKIES } from '@/config'
import TwtmfCrawler from '@/crawler'

const router = Router()
const twtmf = new TwtmfCrawler(TW_COOKIES)

router.get('/tweet/:id', async (req, res) => {
  const id = req.params.id
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid id',
    })
  }

  const tweet = await twtmf.tweet(id)
  return res.json({
    success: true,
    data: tweet,
  })
})

router.get('/:screenName/timeline', async (req, res) => {
  const screenName = req.params.screenName
  const limit =
    typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 100
  if (!/^[A-Za-z0-9-_]+$/.test(screenName)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid screen name',
    })
  }

  const tweets = await twtmf.timeline({ screenName, limit })
  return res.json({
    success: true,
    data: tweets,
  })
})

export default router

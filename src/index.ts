import './server'

import { TW_COOKIES } from './config'
import TwtmfCrawler from './crawler'

const twtmf = new TwtmfCrawler(TW_COOKIES)
twtmf.init().then(() => {
  twtmf
    .tweet('1667359679364870144')
    .then((tweet) => {
      console.log(JSON.stringify(tweet))
    })
    .catch((err) => {
      console.error(err)
    })
})

import puppeteer, {
  Browser,
  HTTPResponse,
  KnownDevices,
  Page,
  Protocol,
} from 'puppeteer'

import { delay } from '@/utils'

import { Tweet } from './types'
import { defaultRequestHandler } from './utils'

export default class TwtmfCrawler {
  private browser: Browser | null = null
  private cookie: Protocol.Network.CookieParam[] | null = null

  constructor(cookie?: string) {
    this.cookie = cookie
      ? cookie
          .split(';')
          .map((c) => c.trim())
          .filter((c) => c.includes('='))
          .map((cookie) => {
            const [name, value] = cookie.split('=')
            return {
              name,
              value,
              domain: '.twitter.com',
              path: '/',
            }
          })
      : null
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
      defaultViewport: {
        width: 393,
        height: 851,
      },
    })
  }

  private async newPage(
    url: string,
    responseHandler?: (r: HTTPResponse) => Promise<void>,
  ): Promise<Page> {
    if (!this.browser) throw new Error('Browser is not initialized')
    const page = await this.browser.newPage()
    await page.emulate(KnownDevices['iPhone 13 Pro'])
    await page.setBypassServiceWorker(true)
    await page.setRequestInterception(true)

    page.on('request', defaultRequestHandler)
    if (responseHandler) {
      page.on('response', responseHandler)
    }

    if (this.cookie) {
      await page.setCookie(...this.cookie)
    }
    await page.goto(url)
    return page
  }

  public async screenName(): Promise<string> {
    if (!this.cookie) {
      throw new Error('Cookie is not set')
    }
    const page = await this.newPage(`https://twitter.com/home`)
    const html = await page.content()
    const screenName = html.match(/"screen_name":"(\w{1,15})"/)?.[1]
    await page.close()
    return screenName
  }

  public async timeline(opt?: {
    screenName?: string
    limit?: number
  }): Promise<Tweet[]> {
    const { screenName, limit = 100 } = opt ?? {}
    const tweets = []
    const cursors = []
    let error: string | null = null

    const responseHandler = async (res: HTTPResponse) => {
      if (res.request().resourceType() !== 'xhr') return
      if (!res.url().includes('graphql')) return
      if (res.url().includes('/UserTweets')) {
        const json = await res.json()
        const entries =
          json.data.user.result.timeline_v2.timeline.instructions.find(
            (e) => e.type === 'TimelineAddEntries',
          )?.entries ?? []
        const resTweets = entries.filter(
          (e) =>
            e.content.entryType === 'TimelineTimelineItem' &&
            e.content.itemContent.itemType === 'TimelineTweet',
        )
        const resCursors = entries.filter(
          (e) =>
            e.content.entryType === 'TimelineTimelineCursor' &&
            e.content.cursorType === 'Bottom',
        )
        tweets.push(...resTweets)
        cursors.push(...resCursors)
      }
      if (res.url().includes('/UserByScreenName')) {
        const user = (await res.json()).data.user
        if (!user) error = 'User not found'
      }
    }

    const target = screenName ?? (await this.screenName())
    const page = await this.newPage(
      `https://twitter.com/${target}`,
      responseHandler,
    )
    const elem = await page.waitForSelector("div[data-testid='primaryColumn']")
    const boundingBox = await elem.boundingBox()
    await page.mouse.move(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2,
    )

    while (tweets.length < limit) {
      if (error) throw error

      await page.mouse.wheel({ deltaY: 1000 })
      if (cursors.some((e) => e.content.stopOnEmptyResponse)) {
        break
      }
      await delay(10)
    }

    return tweets
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((e) => e.content.itemContent.tweet_results.result.legacy) as Tweet[]
  }

  public tweet(id: string): Promise<Tweet> {
    return new Promise((resolve, reject) => {
      const responseHandler = async (res: HTTPResponse) => {
        if (res.request().resourceType() !== 'xhr') return
        if (!res.url().includes('graphql')) return
        if (res.url().includes('/TweetDetail')) {
          const json = await res.json()
          if (json.errors?.[0]) {
            return reject(json.errors[0]?.message ?? 'Unknown error')
          }

          const entries =
            json.data?.threaded_conversation_with_injections_v2?.instructions.find(
              (e) => e.type === 'TimelineAddEntries',
            )?.entries ?? []
          const tweet = entries.find(
            (e) =>
              e.content.entryType === 'TimelineTimelineItem' &&
              e.content.itemContent.itemType === 'TimelineTweet',
          )?.content.itemContent.tweet_results.result.legacy
          resolve(tweet)
        }
      }

      this.newPage(`https://twitter.com/_/status/${id}`, responseHandler)
    })
  }
}

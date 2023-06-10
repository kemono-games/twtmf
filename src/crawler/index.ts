import e from 'express'
import puppeteer, {
  Browser,
  HTTPResponse,
  KnownDevices,
  Protocol,
  ResourceType,
} from 'puppeteer'

import { delay } from '@/utils'
import { logger } from '@/utils/logger'

const ABORT_RESOURCE_TYPES: ResourceType[] = ['image', 'media', 'font']
const ABORT_SCRIPT_URL_KEYWORDS = [
  'shared~loader.video',
  'EmojiPicker',
  'emoji',
  'bundle.NetworkInstrument',
  'loader.PushNotificationsPrompt',
  'google',
]
const ABORT_XHR_URL_KEYWORDS = [
  'events',
  'client_event.json',
  'log.json',
  'init.json',
  '/keyregistry/register',
  'getAltTextPromptPreference',
  'hashflags.json',
  'settings.json',
  'AudioSpaceById',
]

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
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: {
        width: 393,
        height: 851,
      },
    })
    logger.info('Browser launched')
  }

  private async newPage(
    url: string,
    requestHandler?: (r: HTTPResponse) => Promise<void>,
  ) {
    const page = await this.browser.newPage()
    await page.emulate(KnownDevices['iPhone 13 Pro'])
    await page.setBypassServiceWorker(true)
    await page.setRequestInterception(true)

    page.on('request', (req) => {
      if (req.url().includes('sw.js')) {
        req.abort()
      }
      if (ABORT_RESOURCE_TYPES.includes(req.resourceType())) {
        req.abort()
      } else if (req.resourceType() === 'script') {
        if (
          ABORT_SCRIPT_URL_KEYWORDS.some((keyword) =>
            req.url().includes(keyword),
          )
        ) {
          req.abort()
        } else {
          req.continue()
        }
      } else if (req.resourceType() === 'xhr') {
        if (
          ABORT_XHR_URL_KEYWORDS.some((keyword) => req.url().includes(keyword))
        ) {
          req.abort()
        } else {
          req.continue()
        }
      } else {
        req.continue()
      }
    })

    if (requestHandler) {
      page.on('response', (res) => {
        requestHandler(res)
      })
    }

    if (this.cookie) {
      await page.setCookie(...this.cookie)
      logger.info('Cookies set')
    }
    await page.goto(url)
    return page
  }

  public async screenName() {
    if (!this.cookie) {
      throw new Error('Cookie is not set')
    }
    logger.info('Start getting screen name')
    const page = await this.newPage(`https://twitter.com/home`)
    const html = await page.content()
    const screenName = html.match(/"screen_name":"(\w{1,15})"/)?.[1]
    logger.info(`Screen name: ${screenName}`)
    await page.close()
    return screenName
  }

  public async timeline(opt?: { screenName?: string; limit?: number }) {
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
    logger.info(`Start getting timeline of ${target}`)
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
      if (error) {
        logger.warn(error)
        throw error
      }

      await page.mouse.wheel({ deltaY: 1000 })
      if (cursors.some((e) => e.content.stopOnEmptyResponse)) {
        break
      }
      await delay(10)
    }

    logger.info(`Got ${tweets.length} entries`)
    return tweets
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((e) => e.content.itemContent.tweet_results.result.legacy)
  }

  public tweet(id: string) {
    return new Promise((resolve, reject) => {
      const responseHandler = async (res: HTTPResponse) => {
        if (res.request().resourceType() !== 'xhr') return
        if (!res.url().includes('graphql')) return
        if (res.url().includes('/TweetDetail')) {
          const json = await res.json()
          if (json.errors?.[0]) {
            logger.warn(json.errors[0].message)
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

      logger.info(`Start getting tweet: ${id}`)
      this.newPage(`https://twitter.com/_/status/${id}`, responseHandler)
    })
  }
}

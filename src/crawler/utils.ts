import { HTTPRequest } from 'puppeteer'

import {
  ABORT_RESOURCE_TYPES,
  ABORT_SCRIPT_URL_KEYWORDS,
  ABORT_XHR_URL_KEYWORDS,
} from './consts'

export const defaultRequestHandler = async (req: HTTPRequest) => {
  if (ABORT_RESOURCE_TYPES.includes(req.resourceType())) {
    req.abort()
  } else if (req.resourceType() === 'script') {
    if (
      ABORT_SCRIPT_URL_KEYWORDS.some((keyword) => req.url().includes(keyword))
    ) {
      req.abort()
    } else {
      req.continue()
    }
  } else if (req.resourceType() === 'xhr') {
    if (ABORT_XHR_URL_KEYWORDS.some((keyword) => req.url().includes(keyword))) {
      req.abort()
    } else {
      req.continue()
    }
  } else {
    req.continue()
  }
}

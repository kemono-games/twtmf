import { NextFunction, Request, Response } from 'express'

import { SECRET_KEY } from '@/config'
import { logger } from '@/utils/logger'

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!SECRET_KEY || SECRET_KEY.length === 0) {
    logger.info('SECRET_KEY is not set')
  } else if (req.headers.authorization !== SECRET_KEY) {
    logger.info('Unauthorized')
    return res.status(401).json({
      message: 'Unauthorized',
    })
  }
  next()
}

export default authMiddleware

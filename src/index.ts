import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import morgan from 'morgan'

import { LOG_FORMAT, NODE_ENV, PORT } from '@/config'
import errorMiddleware from '@/middlewares/error.middleware'
import { logger, stream } from '@/utils/logger'
import validateEnv from '@/utils/validateEnv'

import authMiddleware from './middlewares/auth.middleware'

validateEnv()

const app = express()
const env = NODE_ENV || 'development'
const port = PORT || 3000

app.use(morgan(LOG_FORMAT, { stream, skip: (req) => req.path === '/health' }))
app.use(hpp())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/health', (_, res) => res.send('OK'))

app.use(authMiddleware)

// APIs

app.use(errorMiddleware)

app.listen(port, () => {
  logger.info(`=================================`)
  logger.info(`======= ENV: ${env} =======`)
  logger.info(`🚀 App listening on the port ${port}`)
  logger.info(`=================================`)
})

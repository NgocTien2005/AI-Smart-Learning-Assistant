import { Router } from 'express'

const router = Router()

router.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'ai-smart-learning-assistant-api',
  })
})

export default router
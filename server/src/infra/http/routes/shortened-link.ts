import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

export const shortenedLinkRoutes: FastifyPluginAsyncZod = async server => {
  server.post('/shortened-links', () => {
    return 'Hello World'
  })
}

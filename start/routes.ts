import Route from '@ioc:Adonis/Core/Route'
import EventController from 'App/Controllers/EventController'

Route.get('/', () => {
  return '.'
})

Route.post('/events', async (ctx) => {
  return new EventController().index(ctx)
}).middleware('signature')

Route.get('/ping', () => {
  return 'pong'
})

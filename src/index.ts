import { Hono } from 'hono'
import { userRouter } from './routers/userRouter'
import { bookingRouter } from './routers/bookingRouter'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
app.route('/api/user',userRouter)
app.route('/api/booking',bookingRouter)
export default app

import { Hono } from 'hono'
import { userRouter } from './routers/userRouter'
import { bookingRouter } from './routers/bookingRouter'
import { cors } from 'hono/cors'

const app = new Hono()
app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));
app.get('/', (c) => {
  const date=new Date()
  return c.text('Hello today is '+date.toDateString()+' and time is '+date.toTimeString()+' and it is a good day to code!');
})
app.route('/api/user',userRouter)
app.route('/api/booking',bookingRouter)
export default app

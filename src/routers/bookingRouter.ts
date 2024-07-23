import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { cricketCourtId, pickleBall1CourtId, pickleBall2CourtId } from "../var";
export const bookingRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();
bookingRouter.post('/addCourt', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    try {
        const body = await c.req.json();
        const { name } = body;
        const court = await prisma.court.create({
            data: {
                name
            }
        });
        const id = court.id;
        return c.json({ message: 'Court added successfully', cid: id });
    } catch (error) {
        return c.json({ error: 'Error adding court' });
    }
})
bookingRouter.post('/createSlots', async (c) => {
    const { startDate, endDate, sportName, courtId } = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    // Check if the provided courtId exists
    const court = await prisma.court.findUnique({
        where: { id: courtId }
    });

    if (!court) {
        return c.json({ success: false, message: 'Invalid courtId' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = sportName === 'pickelball' ? 60 : 30; // duration in minutes
    const startTime = 6 * 60; // 6 AM in minutes
    const endTime = 24 * 60; // 12 midnight in minutes

    const slots = [];
    console.log(duration);
    const formatTime = (minutes: any) => {
        const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
        const mins = (minutes % 60).toString().padStart(2, '0');
        return `${hours}:${mins}`;
    };

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        for (let time = startTime; time < endTime; time += duration) {
            const from = formatTime(time);
            const to = formatTime(time + duration);
            console.log(date, from, to);
            slots.push({
                date: new Date(date),
                from: from,
                to: to,
                isBooked: false,
                courtId: courtId
            });
        }
    }

    try {
        await prisma.slot.createMany({
            data: slots
        });
        return c.json({ success: true, message: 'Slots created successfully' });
    } catch (error) {
        return c.json({ success: false, message: 'An error occurred while creating slots' });
    }
});

bookingRouter.delete('/deleteSlots', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        await prisma.slot.deleteMany({});

        return c.json({ message: 'All slots deleted successfully' });
    } catch (error) {
        return c.json({ error: 'Error deleting slots' });
    }
})
bookingRouter.get('/getAllCourts', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    try {
        const courts = await prisma.court.findMany();
        return c.json({ courts });
    } catch (error) {
        return c.json({ error: 'Error fetching courts' });
    }
})
bookingRouter.put('/bookSlot', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const { userId, from, to, date, sport } = await c.req.json();

    // Determine the courtId based on the sport
    let courtId;
    switch (sport) {
        case 'cricket':
            courtId = "d164c19d-797c-4a91-a67a-2e3ca08e2e6f";
            break;
        case 'pickleball1':
            courtId = "f33e55e9-e9a9-43d6-90ce-c9aa372c684a";
            break;
        case 'pickleball2':
            courtId = "7eddd897-15e5-4adf-a4d5-a9776af8f26d";
            break;
        default:
            return c.json({ message: 'Invalid sport' });
    }

    try {
        // Find the existing slot
        const slot = await prisma.slot.findFirst({
            where: {
                date: new Date(date),
                from,
                to,
                courtId
            }
        });

        if (!slot) {
            return c.json({ message: 'Slot not found' });
        }

        if (slot.isBooked) {
            return c.json({ message: 'Slot already booked' });
        }

        // Update the slot to mark it as booked
        await prisma.slot.update({
            where: {
                id: slot.id
            },
            data: {
                isBooked: true
            }
        });

        // Create a new booking record
        const booking = await prisma.booking.create({
            data: {
                userId,
                slotId: slot.id
            }
        });

        return c.json({ message: 'Slot booked successfully', booking });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'An error occurred while booking the slot' });
    }
});
bookingRouter.get('/getSlots/:court/:startDate/:endDate', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    let id;
    const startDate = new Date(c.req.param('startDate'));
    const endDate = new Date(c.req.param('endDate'));
    // const endDate=new Date();
    const court = c.req.param('court');
    switch (court) {
        case 'cricket':
            console.log('cricket');
            id = "d164c19d-797c-4a91-a67a-2e3ca08e2e6f";
            break;
        case 'pickleball1':
            id = "f33e55e9-e9a9-43d6-90ce-c9aa372c684a";
            break;
        case 'pickleball2':
            id = "7eddd897-15e5-4adf-a4d5-a9776af8f26d";
            break;
        default:
            break;
    }
    try {
        console.log(id)
        const slots = await prisma.slot.findMany({
            where: {
                courtId: id,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }
        });
        return c.json({ slots });
    } catch (error) {
        return c.json({ error: 'Error fetching slots' });
    }
})
bookingRouter.get('/getAllSlots', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    try {
        const slots = await prisma.slot.findMany();
        return c.json({ slots });
    } catch (error) {
        return c.json({ error: 'Error fetching slots' });
    }
})
bookingRouter.get('/getBookings', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    try {
        const bookings = await prisma.booking.findMany({
            select:{
                id:true,
                userId:true,
                slotId:true,
                slot:{
                    select:{
                        id:true,
                        date:true,
                        from:true,
                        to:true,
                        courtId:true
                    }
                },
                user:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            },
            
        });
        return c.json({ bookings });
    } catch (error) {
        return c.json({ error: 'Error fetching bookings' });
    }
})
export default bookingRouter;
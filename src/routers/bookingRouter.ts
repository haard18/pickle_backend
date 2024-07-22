import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { cricketCourtId, footballCourtId, pickleBall1CourtId, pickleBall2CourtId } from "../var";
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
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const { startDate, endDate, sport } = await c.req.json();
    console.log(startDate, endDate, sport);
    let increment, courtId;
    if (sport === 'cricket') {
        increment = 30; // 30 minutes
        courtId = cricketCourtId;
    }
    else if (sport === 'football') {
        increment = 30; // 30 minutes
        courtId = footballCourtId;
    }
    else if (sport === 'pickleball1') {
        increment = 60; // 1 hour
        courtId = pickleBall1CourtId;
    } else if (sport === 'pickleball2') {
        increment = 60; // 1 hour
        courtId = pickleBall2CourtId;
    }
    else {
        return c.json({ error: 'Invalid sport name' }, 400);
    }

    try {
        let date = new Date(startDate);
        const endDateObj = new Date(endDate);

        while (date <= endDateObj) {
            const dateString = date.toISOString().split('T')[0];

            // Generate slot timings based on the provided duration
            const slots = [];
            let currentTime = new Date(dateString + 'T06:00:00'); 

            while (currentTime.getHours() < 24) { // End at midnight
                const fromTime = currentTime.toISOString().split('T')[1].split('.')[0];
                let toTime = '';

                if (increment === 30) {
                    currentTime.setMinutes(currentTime.getMinutes() + increment);
                    toTime = currentTime.toISOString().split('T')[1].split('.')[0];
                } else if (increment === 60) {
                    currentTime.setHours(currentTime.getHours() + 1);
                    toTime = currentTime.toISOString().split('T')[1].split('.')[0];
                }

                slots.push({
                    date: new Date(dateString),
                    from: fromTime,
                    to: toTime,
                    isBooked: false,
                    courtId: courtId
                });

                // Stop generating slots if it exceeds the day boundary
                if (currentTime.getHours() === 0 && currentTime.getMinutes() === 0) {
                    break;
                }
            }

            await prisma.slot.createMany({
                data: slots,
            });

            // Increment the date correctly
            date.setDate(date.getDate() + 1);
        }

        return c.json({ message: 'Slots for all dates created successfully' });
    } catch (error) {
        return c.json({ error: 'Error creating slots for the specified dates' });
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
    const body = await c.req.json();
    const { userId, from, to, date } = body;
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {

        const parsedDate = date + " 00:00:00"
        const slotData = await prisma.slot.findFirst({
            where: {
                date: parsedDate,
                from: from,
                to: to
            }
        });

        if (!slotData) {
            return c.json({ error: 'Invalid slot' });
        }

        if (slotData.isBooked) {
            return c.json({ error: 'Slot already booked' });
        }

        const booking = await prisma.booking.create({
            data: {
                userId,
                slotId: slotData.id
            }
        });

        await prisma.slot.update({
            where: {
                id: slotData.id
            },
            data: {
                isBooked: true
            }
        });

        return c.json({ message: 'Slot booked successfully' });
    } catch (error) {
        return c.json({ error: 'Error booking slot', details: "Error creating " });
    } finally {
        await prisma.$disconnect();
    }
});
bookingRouter.get('/getSlots/:dates', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const dates = c.req.param('dates');
    const [startDate, endDate] = dates.split(',');

    // Validate query parameters
    if (!startDate || !endDate) {
        return c.json({ error: 'Both startDate and endDate must be provided' });
    }

    try {
        // Convert query parameters to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Fetch slots within the specified date range
        const slots = await prisma.slot.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Structure slots by date with from, to, and isBooked
        const slotsByDate: Record<string, { from: string; to: string; isBooked: boolean; }[]> = {};
        slots.forEach(slot => {
            const dateKey = slot.date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
            }
            slotsByDate[dateKey].push({
                from: slot.from,
                to: slot.to,
                isBooked: slot.isBooked
            });
        });

        return c.json({ slots: slotsByDate });
    } catch (error) {
        return c.json({ error: 'Error fetching slots' });
    }
});
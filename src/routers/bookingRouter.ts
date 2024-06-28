import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
export const bookingRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();
bookingRouter.post('/createSlot', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const slotTimings = [
        { from: "00:00:00", to: "01:00:00" },
        { from: "06:00:00", to: "07:00:00" },
        { from: "07:00:00", to: "08:00:00" },
        { from: "08:00:00", to: "09:00:00" },
        { from: "09:00:00", to: "10:00:00" },
        { from: "10:00:00", to: "11:00:00" },
        { from: "11:00:00", to: "12:00:00" },
        { from: "12:00:00", to: "13:00:00" },
        { from: "13:00:00", to: "14:00:00" },
        { from: "14:00:00", to: "15:00:00" },
        { from: "15:00:00", to: "16:00:00" },
        { from: "16:00:00", to: "17:00:00" },
        { from: "17:00:00", to: "18:00:00" },
        { from: "18:00:00", to: "19:00:00" },
        { from: "19:00:00", to: "20:00:00" },
        { from: "20:00:00", to: "21:00:00" },
        { from: "21:00:00", to: "22:00:00" },
        { from: "22:00:00", to: "23:00:00" },
        { from: "23:00:00", to: "00:00:00" }
    ];

    // Define the date range for which slots should be created
    const startDate = new Date('2024-07-01'); // Change this to your desired start date
    const endDate = new Date('2024-07-07'); // Change this to your desired end date

    try {
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateString = date.toISOString().split('T')[0];

            const slots = slotTimings.map((timing) => ({
                date: new Date(dateString),
                from: timing.from,
                to: timing.to,
                isBooked: false,
            }));

            await prisma.slot.createMany({
                data: slots,
            });
        }

        return c.json({ message: 'Slots for all dates created successfully' });
    } catch (error: any) {
        return c.json({ error: 'Error creating slots for the specified dates', details: error.message });
    }
});
bookingRouter.post('/bookSlot', async (c) => {
    const body = await c.req.json();
    const { userId, from, to, date } = body;
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {

        const parsedDate = new Date(date);
        parsedDate.setUTCHours(0, 0, 0, 0);

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
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
// bookingRouter.post('/bookSlot', async (c) => {
//     const body = await c.req.json();
//     const { userId, slotFrom, slotTo, day } = body;
//     const prisma = new PrismaClient({
//         datasourceUrl: c.env.DATABASE_URL
//     }).$extends(withAccelerate());
//     const dayData = await prisma.day.findFirst({
//         where: {
//             name: day
//         }
//     });
//     if (!dayData) {
//         return c.json({ error: 'Invalid day' });
//     }
//     const slotData = await prisma.slot.findFirst({
//         where: {
//             from: slotFrom,
//             to: slotTo,
//             dayId: dayData.id
//         }
//     });
//     if (slotData?.isBooked) {
//         return c.json({ error: 'Slot already booked' });
//     }
//     if (!slotData) {
//         return c.json({ error: 'Invalid slot' });
//     }
//     const booking = await prisma.booking.create({
//         data: {
//             userId,
//             slotId: slotData.id
//         }
//     });
//     await prisma.slot.update({
//         where: {
//             id: slotData?.id
//         },
//         data: {
//             isBooked: true
//         }
//     });
// })
// bookingRouter.get('/getBookings', async (c) => {
//     const prisma = new PrismaClient({
//         datasourceUrl: c.env.DATABASE_URL
//     }).$extends(withAccelerate());
//     const bookings = await prisma.booking.findMany({
//         select: {
//             id: true,
//             userId: true,
//             slotId: true,
//             user: {
//                 select: {
//                     name: true,
//                     phoneNo: true,
//                     email: true
//                 }

//             },
//             slot: {
//                 select: {
//                     from: true,
//                     to: true,
//                     day: {
//                         select: {
//                             name: true
//                         }
//                     }
//                 }
//             }
//         }
//     });
//     return c.json(bookings);
// })
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { z } from 'zod';

import { sign } from 'hono/jwt';


export const adminRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
        
    };
}>();

const signInSchema = z.object({
    password: z.string().min(6),
    phoneNo: z.string().min(10).max(10),
});
adminRouter.post('/signUp', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const body = await c.req.json();
    const { success } = signInSchema.safeParse(body);
    if (!success) {
        return c.json({ error: 'Invalid data' });
    }
    const existing = await prisma.admin.findFirst({
        where: {
            phoneNo: body.phoneNo,
        },
    });
    if (existing) {
        return c.json({ error: 'Admin already exists' });
    }
    const hashedpassword = await sign(body.password, c.env.JWT_SECRET);
    try {
        const admin=await prisma.admin.create({
            data:{
                name:body.name,
                phoneNo:body.phoneNo,
                password:hashedpassword,
                email:body.email
            }
        })
        const token=await sign({adminId:admin.id},c.env.JWT_SECRET);
        return c.json({token:token});

    } catch (error) {
        return c.json({ error: 'Error in creating admin' });
    }
});


adminRouter.post('/signIn', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const body = await c.req.json();
    const { success } = signInSchema.safeParse(body);
    if (!success) {
        return c.json({ error: 'Invalid data' });
    }
    const existing = await prisma.admin.findFirst({
        where: {
            phoneNo: body.phoneNo,
        },
    });
    if (!existing) {
        return c.json({ error: 'Admin not found' });
    }
    const password=await sign(body.password,c.env.JWT_SECRET);
    if(password!==existing.password){
        return c.json({error:'Invalid password'});
    }
    const token=await sign({adminId:existing.id},c.env.JWT_SECRET);
    return c.json({token:token,message:"Success"});
})
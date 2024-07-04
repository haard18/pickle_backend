import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { z } from 'zod';
import { decode, verify, sign, jwt } from "hono/jwt";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();
const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string(),
    phoneNo: z.string().min(10).max(10)
})
userRouter.post('/signUp', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    // console.log(c.body);
    const body = await c.req.json();
    const { success } = signUpSchema.safeParse(body);
    if (!success) {
        return c.json({ error: "Invalid data" });
    }
    const existing = await prisma.user.findFirst({
        where: {
            email: body.email,
        },
    });
    if (existing) {
        return c.json({ error: "User already exists" });
    }

    const hashedpassword =await sign(body.password, c.env.JWT_SECRET);
    console.log(hashedpassword)
    try {
        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: hashedpassword,
                name: body.name,
                phoneNo: body.phoneNo
            }
        })
        const token=await sign({userid:user.id},c.env.JWT_SECRET);
        return c.json({token:token});

    } catch (error) {
        return c.json({ error: "Error in creating user" });
    }
})
const signInSchema = z.object({
    phoneNo: z.string(),
    password: z.string().min(6),
})
userRouter.post('/signIn',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    const body = await c.req.json();
    const { success } = signInSchema.safeParse(body);
    if (!success) {
        return c.json({ error: "Invalid data" });
    }
    const user = await prisma.user.findFirst({
        where: {
            phoneNo: body.phoneNo,
        },
    });
    if (!user) {
        return c.json({ error: "User not found" });
    }
    const decoded = await verify(user.password, c.env.JWT_SECRET);
    if (decoded !== body.password) {
        return c.json({ error: "Invalid password" });
    }
    const token=await sign({userid:user.id},c.env.JWT_SECRET);
    return c.json({token:token,message:"Success"});
})
userRouter.get('/getAllUsers',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            phoneNo: true
        }
    });
    return c.json(users);
})
const { decode,verify } = require('hono/jwt')

async function verifypass(){

    const tokenToVerify = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ImhhYXJkMTIzIg.MDlmKSI6tAPCgZHruzM6EQGHZYT1Vv7wk9R3ei4u_Ak'
    const secretKey = 'haard@1808'
    const decodedPayload = await verify(tokenToVerify, secretKey)
    console.log(decodedPayload)
}
verifypass()
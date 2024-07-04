const { decode, verify, sign, jwt } =require("hono/jwt");

function verifyToken(token){
    const decoded = decode(token);
    return decoded;
}
// const token=import { decode, verify, sign, jwt } from "hono/jwt";
const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.IkhhYXJkMTgwOCI.8yAROHnNbYi2vzuK8Cy67rsL9CZCcrrp8_lAL9zB_DU"
const result=verifyToken(token);
console.log(result)

const { decode, verify, sign, jwt } =require("hono/jwt");

function verifyToken(token){
    const decoded = decode(token);
    return decoded;
}
// const token=import { decode, verify, sign, jwt } from "hono/jwt";
const token="eeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.InRlc3QxMjMi.UfBUXYQ6g4zKZvNPoOf7hT7-u4DYBzjmPt2_iuBOiiU"
const result=verifyToken(token);
console.log(result)

import { toNodeHandler } from 'better-auth/node';
import express from 'express'
import cors from 'cors'
import { auth } from './lib/auth.js';
import dotenv from 'dotenv'
import userRouter from "./routes/user.route.js"
import courseRouter from "./routes/course.route.js"

dotenv.config()

const app = express()
const PORT = 3000;

if (!process.env.FRONTEND_URL) throw Error("Frontend URL is missing");


// Configure CORS middleware
app.use(
  cors({
    origin:"http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.all('/api/auth/*any', toNodeHandler(auth));

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);

app.get('/',(req,res) => {
    res.send('cool')
})

app.listen(PORT,() => {
    console.log(`Listening on port ${PORT}`)
})



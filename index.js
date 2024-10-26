import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import dbConnect from "./utils/dbConnection.js"
import userRouter from "./routes/user.route.js"
import postRouter from "./routes/post.route.js"
import messagesRouter from "./routes/messages.route.js"
import { app,server } from "./Socket/socket.js"
dotenv.config({})

const PORT=process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
const corsOrigin={
    origin:process.env.FRONT_END_URL,
    credentials:true
}


app.use(cors(corsOrigin))

app.use("/api/v1/users",userRouter)
app.use("/api/v1/post",postRouter)
app.use("/api/v1/message",messagesRouter)

app.get("/",function(req,res){
    res.status(200).json({
        message:"Backend running",
        success:true
    })
})
server.listen(PORT,()=>{
    dbConnect()
    console.log(`Server is listening at port ${PORT}`)
})
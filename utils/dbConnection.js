import mongoose from "mongoose";
const dbConnect =async()=>{
    try {
        mongoose.connect(process.env.MONGO_LINK)
        console.log("MongoDB Connected successfully")
    } catch (error) {
        console.log(error)   
    }
}

export default dbConnect;
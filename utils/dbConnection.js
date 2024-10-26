import mongoose from "mongoose";
const dbConnect =async()=>{
    mongoose.connect(`${process.env.MONGO_LINK}`)
    .then(()=>{
        console.log("MongoDB Connected ")
    }).catch((error)=>{
        console.log(`Some Error Occured:${error}`)
    })
}

export default dbConnect;
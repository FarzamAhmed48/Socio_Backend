import {Conversation} from "../models/conversation.model.js";
import {Message} from "../models/message.model.js";
import { getReceiverSocketId, io } from "../Socket/socket.js";

export const sendMessage=async (req,res)=>{
    try {
        const senderId=req.id;
        const receiverId=req.params.id
        const {textMessage:message}=req.body
        console.log(message)

        let conversation=await Conversation.findOne({
            participants:{$all:[senderId,receiverId]}
        })

        if(!conversation) {
            conversation=await Conversation.create({
                participants:[senderId,receiverId],
                
            })
        }
        const newMessage=await Message.create({
            senderId,
            receiverId,
            message
        });
        await newMessage.save()
        if(newMessage) conversation.messages.push(newMessage._id);
        await conversation.save();


        //realtime messages
        const receiverSocketId=getReceiverSocketId(receiverId)

        //We created a function in Socket.js which will receive receiverId from backend and it will accept that id and based on that id it will return socketId corresponding to that ID 

        //and the below code does that it will send newMessage that we created in our API to the receiverSocketId
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }
        return res.status(201).json({
            success:true,
            newMessage
        })
    } catch (error) {
        console.log(error)
    }
}


export const getMessages=async(req,res)=>{
    try {
        const senderId=req.id;
        const receiverId=req.params.id
        let conversation=await Conversation.findOne({
            participants:{$all:[senderId,receiverId]}
        }).populate("messages")

        if(!conversation)  return res.status(200).json({
            message:[],
            success:true
        });
        return res.status(200).json({
            success:true,
            message:conversation?.messages
        })
    } catch (error) {
        console.log(error)
    }
}
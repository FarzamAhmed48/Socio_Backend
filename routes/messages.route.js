import express from "express"
import isAuthenticated from "../middleware/isAuthenticated.js"
import { getMessages, sendMessage } from "../controllers/message.controller.js"
const app=express()
const router=express.Router()

router.post("/send/:id",isAuthenticated,sendMessage)
router.get("/all/:id",isAuthenticated,getMessages)



export default router;
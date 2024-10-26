import express from "express"
import { editProfile, followOrUnfollow, getSuggestedUsers, login, logout, profile, register } from "../controllers/user.controller.js"
import isAuthenticated from "../middleware/isAuthenticated.js"
import upload from "../middleware/multer.js"
const app=express()
const router=express.Router()

router.post("/register",register)
router.post("/login",login)
router.get("/logout",logout)
router.get("/:id/profile",isAuthenticated,profile)
router.post("/profile/edit",isAuthenticated,upload.single("profilePicture"),editProfile)
router.get("/suggestedUser",isAuthenticated,getSuggestedUsers)
router.post("/followorunfollow/:id",isAuthenticated,followOrUnfollow)


export default router;
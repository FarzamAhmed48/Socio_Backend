import express from "express"
import isAuthenticated from "../middleware/isAuthenticated.js"
import upload from "../middleware/multer.js"
import addNewPost, { addComment, bookmarkPost, deletePost, disLikePosts, getAllCommentsOfPost, getAllPosts, getUserPosts, likePosts } from "../controllers/post.controller.js"



const router=express.Router()

router.post("/addPost",isAuthenticated,upload.single("image"),addNewPost)
router.get("/allPosts",isAuthenticated,getAllPosts)
router.get("/userPost",isAuthenticated,getUserPosts)
router.get("/:id/like",isAuthenticated,likePosts)
router.get("/:id/dislike",isAuthenticated,disLikePosts)
router.post("/:id/comment",isAuthenticated,addComment)
router.get("/:id/allComments",isAuthenticated,getAllCommentsOfPost)
router.delete("/delete/:id",isAuthenticated,deletePost)
router.get("/:id/bookmark",isAuthenticated,bookmarkPost)


export default  router;
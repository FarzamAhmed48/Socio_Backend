import sharp from "sharp"
import cloudinary from "../utils/cloudinary.js"
import { Post } from "../models/post.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import dataUri from "../utils/datauri.js"
import { getReceiverSocketId, io } from "../Socket/socket.js"
const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body
        const image = req.file
        const authorId = req.id

        if (!image) {
            return res.status(401).json({
                message: "Image required",
                success: false
            })
        }
        // const optimizedImageBuffer = await sharp(image.buffer).resize({ width: 800, height: 800, fit: "inside" }).toFormat("jpeg", { quality: 80 }).toBuffer()

        // const fileUri = `data:image:/jpeg;base64,${optimizedImageBuffer.toString('base64')}`
        const fileUri = dataUri(image);
        const cloudResponse = await cloudinary.uploader.upload(fileUri)
        console.log(cloudResponse, "Cloud res")
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId,

        })

        const user = await User.findById(authorId)
        if (user) {
            user.posts.push(post._id)
            await user.save()
        }
        await post.populate({ path: "author", select: "-password" })
        return res.status(201).json({
            message: "Post added successfully!",
            post,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export default addNewPost


export const getAllPosts = async (req, res) => {
    try {
        // const posts = Post.find().sort({ createdAt: -1 }).populate({ path: "author", }).select("username,profilePicture").populate({
        //     path: 'comments',
        //     sort: { createdAt: -1 },
        //     populate: {
        //         path: 'author',
        //         select: 'username,profilePicture'
        //     }

        // })

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ path: "author", select: "username profilePicture" })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });


        return res.status(201).json({
            success: true,
            posts
        })
    } catch (error) {
        console.log(error)
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const userPosts = Post.find({ author: req.id }).sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'username,profilePicture'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username,profilePicture'
            }
        })
        return res.status(201).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}


export const likePosts = async (req, res) => {
    try {
        const Liker = req.id
        const postId = req.params.id
        const post = await Post.findById(postId)
        if (!post) res.status(404).json({
            message: "Post not found",
            success: false
        })

        await post.updateOne({ $addToSet: { likes: Liker } })
        await post.save()


        //Socket.Io

        const user=User.findById(Liker).select("username profilePicture")
        const postOwnerId=post.author.toString()
        if(postOwnerId!==Liker){
            const notifications={
                type:"like",
                userId:Liker,
                userDetails:user,
                message:"Your post was liked"
            }

            const postOwnerSocketId=getReceiverSocketId(postOwnerId)
            io.to(postOwnerSocketId).emit("notification",notifications)
        }
        return res.status(200).json({
            message: 'Post liked',
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export const disLikePosts = async (req, res) => {
    try {
        const Liker = req.id
        const postId = req.params.id
        const post = await Post.findById(postId)
        if (!post) res.status(404).json({
            message: "Post not found",
            success: false
        })

        await post.updateOne({ $pull: { likes: Liker } })
        await post.save()


        //Socket.Io

        const user=User.findById(Liker).select("username profilePicture")
        const postOwnerId=post.author.toString()
        if(postOwnerId!==Liker){
            const notifications={
                type:"dislike",
                userId:Liker,
                userDetails:user,
                message:"Your post was disliked"
            }

            const postOwnerSocketId=getReceiverSocketId(postOwnerId)
            io.to(postOwnerSocketId).emit("notification",notifications)
        }
        return res.status(200).json({
            message: 'Post unliked',
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}



export const addComment = async (req, res) => {
    try {
        const postId = req.params.id
        const { text } = req.body
        const commenterId = req.id

        if (!text) res.status(400).json({
            message: "Text is required",
            success: false
        })
        const comment = await Comment.create({
            text,
            author: commenterId,
            post: postId
        })

        await comment.populate({
            path: 'author',
            select: "username profilePicture bio"
        })
        await comment.save()
        const post = await Post.findById(postId)
        post.comments.push(comment._id)

        await post.save()

        res.status(200).json({
            message: "Comment added Successfully",
            comment,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export const getAllCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id
        const comments = await Comment.findById(postId).populate({
            path: "author",
            select: 'username profilePicture'
        })

        if (!comments) res.status(401).json({
            message: "No comments on this post",
            success: false
        })

        return res.status(200).json({
            success: true,
            comments
        })
    } catch (error) {
        console.log(Error)
    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id
        const userId = req.id
        const post = await Post.findById(postId)
        if (!post) res.status(404).json({ message: "post not found", success: false })

        if (post.author.toString() !== userId) res.status(404).json({ message: "You cannot delete the post", success: false })

        await Post.findByIdAndDelete(postId)
        //here we will delete the post from users post array
        let user = await User.findById(userId)

        user.posts = user.posts.filter(id => id.toString() !== postId)
        await user.save();

        //here we will delete all the comments regarding that post

        await Comment.deleteMany({ post: postId })
        res.status(200).json({
            message:"Post Deleted Successfully",
            success:true
        })

    } catch (error) {
        console.log(error)
    }
}


export const bookmarkPost = async (req, res) => {
    try {
        const userId = req.id
        const postId = req.params.id
        const post = await Post.findById(postId)
        if (!post) res.status(404).json({
            message: "Post not found",
            success: false
        })
        let user = await User.findById(userId)
        if (user.bookmarks.includes(post._id)) {
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save()
            return res.status(200).json({
                message: "Post removed from bookmarks!",
                type: "unsaved",
                success: true
            })
        }
        else {
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            await user.save()
            return res.status(200).json({
                message: "Post bookmarked !",
                type: "saved",
                success: true
            })
        }
    } catch (error) {
        console.log(error)
    }
}
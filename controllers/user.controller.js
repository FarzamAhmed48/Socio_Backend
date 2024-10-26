import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                message:"All fields are required",
                success:false
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message:"User already registered",
                success:false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, username });
        await newUser.save();
        return res.status(201).json({
            message:"User Created Successfully",
            success:true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error.");
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message:"All fields are required",
                success:false
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message:"User not found",
                success:false
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message:"Invalid Credentials",
                success:false
            });
        }
        const populatedPosts=Promise.all(
            user.posts.map(async (postId)=> {
                let post=await Post.findById(postId)
                if (post?.author?._id.equals(user._id)){
                    return post
                }
                return null
            })
        )
        user.posts=populatedPosts

        const token = jwt.sign({ email, userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" });
        res.cookie("token", token, {
            httpOnly: true,
            sameSite:"None",
            secure:true
        }).json({
            message:`Welcome Back ${user.username}`,
            success:true,
            user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error.");
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
            sameSite:"None",
            secure:true
        });
        return res.status(200).json({
            message:"Logged out Successfully",
            success:true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message:"Server Error",
            success:false
        });
    }
};

export const profile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).populate({path:"posts",createdAt:-1}).populate({path:"bookmarks"});
        if (!user) {
            return res.status(404).json({
                message:"User not Found",
                success:true
            });
        }
        return res.status(200).json({
            user,
            success:true,
            message:"User found Successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error.");
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;  
        const { bio, gender } = req.body;
        let profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = dataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                message:"User not found",
                success:false
            });
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();
        return res.status(200).json({
            message:"Profile Updated Successfully",
            success:true,
            user
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message:"Server Error",
            success:false
        });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers || suggestedUsers.length === 0) {
            return res.status(404).json({
                message:"No users Found",
                success:false
            });
        }
        return res.status(200).json({
            message:"Fetched Successfully",
            success:true,
            suggestedUsers
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server Error");
    }
};

export const followOrUnfollow = async (req, res) => {
    try {
        const currentUser = req.id;
        const followedUserId = req.params.id;
        if (currentUser === followedUserId) {
            return res.status(400).send("You cannot follow yourself.");
        }

        const user = await User.findById(currentUser);
        const otherUser = await User.findById(followedUserId);

        if (!user || !otherUser) {
            return res.status(404).send("User not found.");
        }

        const isFollowing = user.following.includes(followedUserId);
        if (isFollowing) {
            await User.updateOne({ _id: currentUser }, { $pull: { following: followedUserId } });
            await User.updateOne({ _id: followedUserId }, { $pull: { followers: currentUser } });
            return res.status(200).json({
                message:"Unfollowed Successfully",
                success:true
            });
        } else {
            await User.updateOne({ _id: currentUser }, { $push: { following: followedUserId } });
            await User.updateOne({ _id: followedUserId }, { $push: { followers: currentUser } })
            return res.status(200).json({
                message:"Followed Successfully",
                success:true
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error.");
    }
};
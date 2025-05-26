import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: "15d" });
}

router.post("/register", async (req, res) => {
    try {
        const { email, username, password } = req.body

        if (!email || !username || !password) {
           return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password should be at least 6 characters long" });
        }
        if (username.length < 6) {
            return res.status(400).json({ message: "Username should be at least 3 characters long" });
        }

        // check if user already exist
        const existingEmail = await User.findOne({email});
        if (existingEmail) return res.status(400).json({ message: "Email already exists"});

        const existingUsername = await User.findOne({username});
        if (existingUsername) return res.status(400).json({ message: "Username already exists"});

        const profileImage = `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${username}`;

        const user = new User({
            email,
            username,
            password,
            profileImage
        })

        await user.save();

        const token = generateToken(user._id)

        res.status(201).json({
            token,
            user:{
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });

    } catch (error) {
        console.log("Error in Register route", error);
        res.status(500).json({ message : "Internal server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password} = req.body;

        // verify infos provided
        if (!email || !password) return res.status(400).json({ message: "All fields are required" });

        // verif user exist
        const user = await User.findOne({ email });
        console.log(user);
        const isPasswordCorrect = await user.comparePassword(password);

        // check if password is correct
        if (!isPasswordCorrect || !user) return res.status(400).json({ message: "Invalid credentials"});

        const token = generateToken(user._id)

        res.status(200).json({
            token,
            user:{
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });

    } catch (error) {
        console.log("Error in Login route", error);
        res.status(500).json({ message : "Internal server error" });
    }
});

export default router;

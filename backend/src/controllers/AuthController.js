import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    const user = new User({ firstName, lastName, email, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    try {
      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ token, userId: user._id });
    } catch (passwordError) {
      return res.status(500).json({ message: "Error during authentication" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
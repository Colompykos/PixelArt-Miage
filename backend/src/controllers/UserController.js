import User from "../models/User.js";
import PixelBoard from "../models/PixelBoard.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      _id: user._id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      _id: updatedUser._id,
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
      email: updatedUser.email || "",
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
  
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current password and new password are required" });
      }
  
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      
      console.log("Current password validation:", isPasswordValid);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
  
      user.password = newPassword;
  
      await user.save();
      
      const updatedUser = await User.findById(req.user.id);
      const testNewPassword = await bcrypt.compare(newPassword, updatedUser.password);
      console.log("New password verification:", testNewPassword);
  
      res.status(200).json({ 
        message: "Password changed successfully",
        requiresLogout: true 
      });
    } catch (error) {
      console.error("Error in changePassword:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
};

export const getUserContributions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userBoards = await PixelBoard.find({ author: userId });
    
    const allBoards = await PixelBoard.find();
    let totalPixelsPlaced = 0;
    
    allBoards.forEach(board => {
      const userPixels = board.pixels.filter(pixel => 
        pixel.user && pixel.user.toString() === userId.toString()
      );
      totalPixelsPlaced += userPixels.length;
    });
    
    res.status(200).json({
      userBoards,
      totalPixelsPlaced
    });
  } catch (error) {
    console.error("Error getting user contributions:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
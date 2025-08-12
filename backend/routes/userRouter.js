// userRouter.js (ganz oben bei den Imports)
import {
  renderVerificationEmail,
  renderResetEmail,
} from "../utils/mailTemplates.js";
import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

import User from "../models/userSchema.js";
import Message from "../models/messageSchema.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (userEmail, verificationKey) => {
  const baseUrl = process.env.CHAT_URL;
  const assets = process.env.ASSET_BASE || baseUrl;
  const sender = process.env.EMAIL_FROM;

  const html = renderVerificationEmail({
    appName: "Chat App",
    title: "Hello, Word!",
    imgUrl: `${assets}/robot.png`,
    verifyUrl: `${baseUrl}/register/verify`,
    code: verificationKey,
  });

  const mailOptions = {
    from: sender,
    to: userEmail,
    subject: "Email Verification",
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

export default (io) => {
  /** USER REGISTER */
  router.post("/register", async (req, res) => {
    try {
      const { email, username, password, language } = req.body;
      const existingUser = await User.findOne({ username });

      if (existingUser) {
        return res.status(409).json({ errorMessage: "Username already taken" });
      }

      const existingEmail = await User.findOne({ email });

      if (existingEmail) {
        return res.status(409).json({ errorMessage: "Email already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password: hashedPassword,
        language,
      });
      await newUser.save();

      const user = await User.findOne({ email });

      const verificationKey = user.verificationKey;

      await sendVerificationEmail(email, verificationKey);

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** USER REGISTER-VERIFICATION */
  router.post("/register/verify", async (req, res) => {
    try {
      const { email, key } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(409).json({ errorMessage: "Email does not exist" });
      }

      if (user.isVerified) {
        return res
          .status(400)
          .json({ message: "Your email is already verified" });
      }

      if (user.verificationKey !== key) {
        return res.status(409).json({
          message: "Verification failed",
          isVerified: user.isVerified,
        });
      }

      await User.updateOne(
        { email },
        { $set: { isVerified: true }, $unset: { verificationKey: "" } }
      );

      const updatedUser = await User.findOne({ email });

      res.json({
        message: "User verified successfully",
        isVerified: updatedUser.isVerified,
      });
    } catch (error) {
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** USER LOGIN */
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ errorMessage: "Invalid email or password" });
      }

      if (!user.isVerified) {
        return res.json({
          message: "Your email is not verified",
          isVerified: user.isVerified,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(404)
          .json({ errorMessage: "Invalid email or password" });
      }

      req.session.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      };
      await req.session.save();
      console.log("User is succesfully authenticated: ", req.session.user);
      res.json({
        message: "User logged in successfully",
        user: req.session.user,
        isVerified: user.isVerified,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** GET CURRENT USER */
  router.get("/current", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ errorMessage: "Not authenticated" });
      }

      const user = await User.findById(req.session.user.id);
      if (!user) {
        return res.status(404).json({ errorMessage: "User not found" });
      }

      res.json({
        username: user.username,
        usermail: user.email,
        dateOfRegistration: user.createdAt,
        volume: user.volume,
        language: user?.language,
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** USER LOGOUT */
  router.get("/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res
            .status(500)
            .json({ errorMessage: "Internal server error" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** USER UPDATE */
  router.patch("/update", async (req, res) => {
    const userId = req.session.user.id;
    const { oldPassword, newPassword } = req.body;

    try {
      const foundUser = await User.findById(userId);
      if (!foundUser) {
        return res.status(404).json({ errorMessage: "User not found!" });
      }

      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ errorMessage: "Enter your old password and new password!" });
      }

      const isMatchPassword = await bcrypt.compare(
        oldPassword,
        foundUser.password
      );

      if (!isMatchPassword) {
        return res
          .status(400)
          .json({ errorMessage: "Something went wrong, please try again!" });
      }

      if (isMatchPassword && newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await User.updateOne(
          { _id: userId },
          { $set: { password: hashedPassword } }
        );
      }

      await foundUser.save();

      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** DELETE USER & ALL MESSAGES */
  router.delete("/delete", async (req, res) => {
    try {
      const userId = req.session.user.id;
      const foundUser = await User.findById(userId);

      if (!foundUser) {
        return res.status(404).json({ errorMessage: `User not found` });
      }

      await Message.deleteMany({ sender: userId });

      io.in(userId).disconnectSockets(true);

      await User.findByIdAndDelete(userId);

      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res
            .status(500)
            .json({ errorMessage: "Internal server error" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: `User has been deleted successfully` });
      });
    } catch (error) {
      console.error("Fehler beim Löschen des Benutzers:", error);
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  const sendNewPw = async (userEmail, key) => {
    const baseUrl = process.env.CHAT_URL;
    const assets = process.env.ASSET_BASE || baseUrl;
    const sender = process.env.EMAIL_FROM;

    const html = renderResetEmail({
      appName: "Chat App",
      title: "Hello, Word!",
      imgUrl: `${assets}/robot.png`,
      resetUrl: `${baseUrl}/new-pw`,
      code: key,
    });

    const resetPw = {
      from: sender,
      to: userEmail,
      subject: "Set new Password",
      html,
    };

    try {
      await transporter.sendMail(resetPw);
      console.log("new password sent successfully");
    } catch (error) {
      console.error("Error sending new password:", error);
    }
  };

  /** FORGOT PW */
  router.patch("/forgot-pw", async (req, res) => {
    const { email } = req.body;

    try {
      const foundUser = await User.findOne({ email });
      if (!foundUser) {
        return res
          .status(404)
          .json({ message: "no user found with this email" });
      }

      function generatePassword(length = 8) {
        const charset =
          "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789";
        let password = "";
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
        return password;
      }

      const key = generatePassword();
      console.log("Generated Key:", key);

      await User.findOneAndUpdate({ email }, { $set: { key } }, { new: true });

      await sendNewPw(email, key);

      res.json({ message: `email with new passwort send` });
    } catch (error) {
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  /** CHANGE NEW PASSWORD */
  router.patch("/new-pw", async (req, res) => {
    try {
      const { email, key, newPw } = req.body;
      const foundUser = await User.findOne({ email });
      if (!foundUser) {
        return res.status(404).json({ message: "No user found" });
      }

      if (key !== foundUser.key) {
        return res.status(401).json({ message: "Key is not correct" });
      }
      const hashedPassword = await bcrypt.hash(newPw, 12);

      await User.findOneAndUpdate(
        { email },
        { $set: { password: hashedPassword }, $unset: { key: "" } },
        { new: true }
      );

      res.status(200).json({ message: "Password successfully changed" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /** CHANGE VOLUME */
  router.patch("/volume", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { volume } = req.body;
      if (!["silent", "middle", "full"].includes(volume)) {
        return res.status(400).json({ error: "Invalid volume value" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.session.user.id,
        { volume },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ message: "Volume successfully changed", volume });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /** CHANGE APP LANGUAGE */
  router.patch("/language", async (req, res) => {
    try {
      const userId = req.session.user?.id;
      const { language } = req.body;

      if (!userId) {
        return res.status(401).json({ errorMessage: "Not authenticated" });
      }

      if (!["en", "de"].includes(language)) {
        return res.status(400).json({ errorMessage: "Invalid language" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { language },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ errorMessage: "User not found" });
      }

      res.json({
        message: "Language updated successfully",
        language: user.language,
      });
    } catch (error) {
      console.error("Error updating language:", error);
      res.status(500).json({ errorMessage: "Internal server error" });
    }
  });

  return router;
};

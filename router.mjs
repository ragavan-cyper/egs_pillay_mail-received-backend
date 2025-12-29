import express from "express";
import Users from "./User_Schema_File/User_Schema.mjs";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import tokenmiddleware from "./Token/token_middleware.mjs";
import mongoose from "mongoose";
import mail from "./Nodemailer/Mailsend_code.mjs";
import sendsmail from "./Nodemailer/Mail_subject_code.mjs";
import EMAIL from "./Email_Schema/Email_Schema.mjs";
const router = express.Router();

dotenv.config();

router.post("/user/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exsting_user = await Users.findOne({ email });
    if (exsting_user) {
      return res
        .status(404)
        .json({ status: 404, message: "Account Already Created" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const new_user = await Users.create({
      name,
      email,
      password: hashed,
    });

    res
      .status(201)
      .json({ status: 201, message: "Account Created Successfully" });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Something Error" });
  }
});

router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const valid_user = await Users.findOne({ email });
    if (!valid_user) {
      return res
        .status(401)
        .json({ status: 401, message: "Account Not Found" });
    }
    const ismatch = await bcrypt.compare(password, valid_user.password);
    if (!ismatch) {
      return res
        .status(400)
        .json({ status: 400, message: "Email Or Password Incorrect" });
    }

    const token = await JWT.sign(
      {
        id: valid_user._id,
        name: valid_user.name,
        role: valid_user.role,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    res
      .status(200)
      .json({ status: 200, message: "LogIn SuccessFully", token: token });
  } catch (error) {
    res.status(404).json({ status: 404, message: "forbidden" });
  }
});

// common page

router.post("/student/home", tokenmiddleware, async (req, res) => {
  const { id, role } = req.user;

  try {
    const allroles = ["superadmin", "admin", "student"];

    if (!allroles.includes(role)) {
      return res.status(403).json({
        status: 403,
        message: "unauthorized user",
      });
    }
    const verifystudent = await Users.findById(id).select("-password");
    if (!verifystudent) {
      return res
        .status(401)
        .json({ status: 401, message: "student details not found" });
    }

    res
      .status(200)
      .json({ status: 200, message: "welcome student", verifystudent });
  } catch (error) {
    res.status(500).json({ status: 500, message: "server crash" });
  }
});

// super-admin only

router.post("/create/superadmin", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const superadmin = await Users.findOne({ role: "superadmin" });
    if (superadmin) {
      return res
        .status(404)
        .json({ status: 400, message: "super-admin -already created one" });
    }

    if (
      !name ||
      !email ||
      !password ||
      name.trim().length === 0 ||
      password.trim().length === 0 ||
      email.trim().length === 0
    ) {
      return res.status(404).json({
        status: 404,
        message: "name and email field and password required",
      });
    }

    const hashedpass = await bcrypt.hash(password, 10);
    const validsuperadmin = await Users.create({
      name,
      email,
      password: hashedpass,
      role: "superadmin",
    });

    res.status(200).json({ status: 200, message: "super admin created" });
  } catch (error) {
    console.log("SUPERADMIN ERROR 👉", error);
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// super-admin created-admins

router.post("/created/admin", tokenmiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  const { id } = req.user;
  try {
    const valid_user = await Users.findById(id);
    if (!valid_user || valid_user.role !== "superadmin") {
      return res.status(404).json({ status: 404, message: "Access Denied" });
    }
    if (
      !name ||
      !email ||
      !password ||
      name.trim().length === 0 ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      return res
        .status(404)
        .json({ status: 404, message: "all fields required" });
    }

    const exsting_user = await Users.findOne({ email });
    if (exsting_user) {
      return res
        .status(404)
        .json({ status: 404, message: "email already exsits" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const new_admin = await Users.create({
      name,
      email,
      password: hashed,
      role: "admin",
    });
    res
      .status(201)
      .json({ status: 201, message: "admin created successfully" });
  } catch (error) {
    res.json({ status: 500, message: "Internal server error" });
  }
});

// admin-message
router.post("/admin/msg", tokenmiddleware, async (req, res) => {
  const { id } = req.user;
  const { subject, message } = req.body;

  try {
    const adminonly = await Users.findById(id);
    if (!adminonly) {
      return res.status(404).json({ message: "user not found" });
    }

    if (!["admin", "superadmin"].includes(adminonly.role)) {
      return res.status(401).json({ message: "unauthorized user" });
    }

    const students = await Users.find({ role: "student" }, { email: 1 });
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const emails = students.map((u) => u.email);

    const success = await sendsmail({
      to: emails,
      subject,
      message,
      senderName: adminonly.name,
      replyTo: adminonly.email,
    });

    await EMAIL.create({
      subject,
      message,
      sendBy: adminonly.email,
      status: success ? "sent" : "failed",
    });

    res.status(200).json({
      message: "Mail sent to all students successfully",
    });
  } catch (error) {
    console.log("MAIL ERROR ", error);
    res.status(500).json({
      message: "Mail sending failed",
    });
  }
});

export default router;

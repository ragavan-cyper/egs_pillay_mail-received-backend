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
import OTP from "./Otpschema/otp_schema.mjs";
import otpgenerate from "./otgenrate/otp_generate.mjs";
import skills from "./skill_schema/skill_schema.mjs";
import JOBS from "./skill_schema/job_role/job_schema.mjs";
import analyzeUser from "./job_role_predict/job_role.mjs";
import Marks from "./Email_Schema/marks_schema/marks.mjs";
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

    const otp = otpgenerate();

    const hashedotp = await bcrypt.hash(otp.toString(), 10);
    await OTP.deleteOne({ email });
    await OTP.create({
      email,
      otp: hashedotp,
    });

    await sendsmail({
      to: email,
      subject: "OTP Verification",
      message: `Your OTP is ${otp}`,
    });

    res.status(201).json({ status: 201, message: "OTP SEND SUCSSESSFULLY" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Something Error" });
  }
});

router.post("/user/verify", async (req, res) => {
  const { name, email, password, otp } = req.body;

  try {
    const otp_user = await OTP.findOne({ email });
    if (!otp_user) {
      return res.status(404).json({ status: 404, message: "otp expire " });
    }

    const otp_match = await bcrypt.compare(otp, otp_user.otp);
    if (!otp_match) {
      return res.status(404).json({ status: 404, message: "INVALID OTP" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const valid_user = await Users.create({
      name,
      email,
      password: hashed,
      role: "student",
    });

    await OTP.deleteOne({ email });
    res
      .status(201)
      .json({ status: 201, message: "ACCOUNT CREATED SUCCESS FULLY" });
  } catch (error) {
    res.status(500).json({
      message: "OTP verification failed",
    });
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

router.post("/users/skill", async (req, res) => {
  const { level, requiredSkills, nextLearn } = req.body;

  try {
    const skilllevel = await skills.create({
      level,
      requiredSkills,
      nextLearn,
    });

    res.status(201).json({ status: 201, message: "skill created", skilllevel });
  } catch (error) {
    console.log(error);
  }
});

router.post("/user/job", async (req, res) => {
  const { title, minLevel, minExperience, requiredSkills } = req.body;

  try {
    const joblevel = await JOBS.create({
      title,
      minLevel,
      minExperience,
      requiredSkills,
    });

    res.status(201).json({ status: 201, message: "job role created" });
  } catch (error) {
    console.log(error);
  }
});
router.post("/user/analyze", async (req, res) => {
  let { skills, experience } = req.body;

  if (Array.isArray(skills)) {
    skills = skills
      .join(",")
      .split(",")
      .map((s) => s.trim().toUpperCase());
  } else if (typeof skills === "string") {
    skills = skills.split(",").map((s) => s.trim().toUpperCase());
  }

  experience = Number(experience);

  const result = await analyzeUser(skills, experience);

  res.json(result);
});

router.post("/user/marks/update", async (req, res) => {
  const { name, reg_num, subject_name, subject_code, semester, cat, marks } =
    req.body;

  try {
    if (!name || !reg_num || !subject_name || !subject_code) {
      return res.status(404).json({
        status: 404,
        message: "ALL FIELDS REQUIRED",
      });
    }
    const exsting_user = await Marks.findOne({ subject_code, semester, cat });
    if (exsting_user) {
      return res.status(401).json({
        status: 401,
        message: "subject internal marks already uploaded",
      });
    }

    const overallmarks = await Marks.create({
      name,
      reg_num,
      subject_code,
      subject_name,
      semester,
      cat,
      internal_marks: marks,
    });

    res.status(201).json({ status: 201, message: overallmarks });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

router.get("/user/mark/show", async (req, res) => {
  const { reg_num } = req.query;

  try {
    if (!reg_num) {
      return res.status(400).json({
        status: 400,
        message: "reg_num is required",
      });
    }

    const valid_user = await Marks.find({ reg_num });
    if (valid_user.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "user details not found" });
    }

    res.status(200).json({ status: 200, data: valid_user });
  } catch (error) {
    console.log(error);
  }
});

export default router;

import express from "express";
import dotenv from "dotenv";
import router from "./router.mjs";
import mongoose from "mongoose";
import cors from "cors";
dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT;

mongoose
  .connect(process.env.MONGO_DB_URL)
  .then(() => {
    console.log("DATA-BASE- CONNECTED");
  })
  .catch((err) => {
    console.log("server crash", err);
  });

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server Connected:${PORT}`);
});

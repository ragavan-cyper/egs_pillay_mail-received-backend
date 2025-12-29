import JWT from "jsonwebtoken";
import dotenv from "dotenv";

const tokenmiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  try {
    if (!token) {
      return res.status(404).json("! Token Missing");
    }

    const decoded = JWT.verify(token.split(" ")[1], process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("SUPERADMIN ERROR 👉", error);
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

export default tokenmiddleware;

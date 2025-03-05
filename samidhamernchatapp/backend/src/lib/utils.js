import jwt from "jsonwebtoken";
import { jwt_secret } from "../constant/constant.js";
import path from "path";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId },process.env.jwt_secret, {
    expiresIn: "7d",
  });

  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "None", // CSRF attacks cross-site request forgery attacks
    secure: true,
    path:'/'
  });

  return token;
};
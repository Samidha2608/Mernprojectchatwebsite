import { v2 as cloudinary } from "cloudinary";

import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.cloudnairy_cloud_name,
  api_key: process.env.cloudnairy_api_key,
  api_secret:process.env.cloudnairy_api_secrate,
});

export default cloudinary;
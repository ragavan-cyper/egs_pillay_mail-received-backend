import mongoose, { now } from "mongoose";

const Otp=mongoose.Schema({

    email: {
    type: String,
    required: true
  },

  otp:{
    type:String,
    required:true


  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180 
  }


})

const otpschema=mongoose.model("Otp",Otp)
export default otpschema
import mongoose from "mongoose";


const User_Schema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
      enum:["student","admin","superadmin"],
        default:"student"
    }
})

const Users=mongoose.model("Users",User_Schema)
export default Users
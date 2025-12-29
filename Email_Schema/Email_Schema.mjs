import mongoose, { Types } from "mongoose";


const EmailSchema=mongoose.Schema({
    subject:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true,
    },
    sendBy:{
        type:String,
        required:true
    },
    status: {
  type: String,
  enum: ["sent", "failed"],
  default: "sent"
},
},
{
    timestamps: true
  }


)

const EMAIL= mongoose.model("email",EmailSchema)
export default EMAIL
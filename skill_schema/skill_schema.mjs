import mongoose from "mongoose";

const skill_schema=mongoose.Schema({
    level:{
        type:String,
        required:true
    },
  requiredSkills: {
    type:[String],
    required:true

    },
    nextLearn:{
        type:[String],
        required:true
    }
})

const Skill=mongoose.model("skill",skill_schema)
export default Skill
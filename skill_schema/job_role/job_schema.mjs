// models/job_schema.mjs
import mongoose from "mongoose";

const job_schema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  minLevel: {
    type: String,
    required: true
  },
  minExperience: {
    type: Number,
    required: true
  },
  requiredSkills: {
    type: [String],   
    required: true
  }
});

const JOB = mongoose.model("job", job_schema);
export default JOB;

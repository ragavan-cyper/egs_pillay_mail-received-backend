import mongoose from "mongoose";

const marks_schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  reg_num: {
    type: String,
    required: true,
  },

  subject_name: {
    type: String,
    required: true,
  },
  subject_code: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  cat: {
    type: String,
    required: true,
  },
  internal_marks: {
    type: Number,
    required: true,
  },
});

const Marks = mongoose.model("marks", marks_schema);
export default Marks;

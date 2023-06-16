const mongoose = require("mongoose");

const AddJob = mongoose.model("AddJob", {
  companyName: String,
  addLogoUrl: String,
  jobPosition: String,
  monthlySalary: Number,
  jobType: String,
  remoteOffice: String,
  location: String,
  jobDescription: String,
  aboutCompany: String,
  skillsRequired: Array,
});

module.exports = AddJob;

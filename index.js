const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Register = require("./models/register.js");
const AddJob = require("./models/addJob.js");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("./public"));

const checkAuthorization = (req, res, next) => {
  try {
    const decodedToken = jwt.verify(
      req.headers.token,
      process.env.JWT_SECRET_KEY
    );
    req.user = decodedToken;
    next();
  } catch (error) {
    res.send({
      Status: "failed",
      Message: "Unauthorized",
    });
  }
};

app.get("/health-api", (req, res) => {
  res.send("Working!");
});

app.post(
  "/register",

  async (req, res) => {
    const { name, email, mobile, password } = req.body;
    try {
      const register = await Register.findOne({ email });
      if (register) {
        return res.send({
          Status: "failed",
          Message: "User already exists with the provided mail",
        });
      }

      const encryptedPassword = await bcrypt.hash(password, 10);

      const newUser = await Register.create({
        name,
        email,
        mobile,
        password: encryptedPassword,
      });
      res.send({
        Status: "Success",
        Message: "User created Successfuly",
        UserName: newUser.name,
      });
    } catch (error) {
      res.send({ error });
    }
  }
);

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const register = await Register.findOne({ email });
    if (register) {
      let passwordMatch = await bcrypt.compare(password, register.password);

      if (passwordMatch) {
        const jwtToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
          expiresIn: 60,
        });
        return res.send({
          Status: "Success",
          Message: "User Logged-in Successfully",
          UserName: register.name,
          jwtToken,
        });
      }
    } else {
      return res.send({
        Status: "failed",
        Message: "Incorrect Credentials!",
      });
    }
  } catch (error) {
    res.send({ error });
  }
  //   next(new Error("user not loogen in successfully"))
});

app.post(
  "/api/addjob",
  [
    body("companyName").notEmpty().withMessage("Company name is required"),
    body("addLogoUrl").notEmpty().withMessage("Logo URL is required"),
    body("jobPosition").notEmpty().withMessage("Job position is required"),
    body("monthlySalary").notEmpty().withMessage("Monthly salary is required"),
    body("jobType").notEmpty().withMessage("Job type is required"),
    body("remoteOffice").notEmpty().withMessage("Remote/office is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("jobDescription")
      .notEmpty()
      .withMessage("Job description is required"),
    body("aboutCompany")
      .notEmpty()
      .withMessage("Company description is required"),
    body("skillsRequired").notEmpty().withMessage("Skills is required"),
  ],
  checkAuthorization,
  async (req, res) => {
    const {
      companyName,
      addLogoUrl,
      jobPosition,
      monthlySalary,
      jobType,
      remoteOffice,
      location,
      jobDescription,
      aboutCompany,
      skillsRequired,
    } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await AddJob.create({
        companyName,
        addLogoUrl,
        jobPosition,
        monthlySalary,
        jobType,
        remoteOffice,
        location,
        jobDescription,
        aboutCompany,
        skillsRequired,
      });
      res.send({
        Status: "Success",
        Message: "Job added Successfuly",
      });
    } catch (error) {
      res.send({ error });
    }
  }
);

app.put("/api/addjob/:id", (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    addLogoUrl,
    jobPosition,
    monthlySalary,
    jobType,
    remoteOffice,
    location,
    jobDescription,
    aboutCompany,
    skillsRequired,
  } = req.body;
  AddJob.findByIdAndUpdate(id, {
    companyName,
    addLogoUrl,
    jobPosition,
    monthlySalary,
    jobType,
    remoteOffice,
    location,
    jobDescription,
    aboutCompany,
    skillsRequired,
  }).then(() => {
    res
      .json({ Status: "Success", Message: "Job Updated Succesfully" })
      .catch((error) => {
        res.json({ error });
      });
  });
});

app.get("/api/jobs/:skills", async (req, res) => {
  const { skills } = req.params;
  const skillsArray = skills.split(",").map((skill) => skill.trim());

  try {
    const jobs = await AddJob.find({ skillsRequired: { $in: skillsArray } });
    res.send({
      Status: "Success",
      Message: "Jobs retrieved successfully",
      Jobs: jobs,
    });
  } catch (error) {
    res.send({ error });
  }
});

app.use((req, res, next) => {
  const err = new Error("Something went wrong! Please try again later.");
  err.status = 404;
  next(err);
});

//Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

app.listen(process.env.SERVER_PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("DB connection Sucessfully");
      console.log("server is running in Port 4000");
    })
    .catch((err) => console.log("DB connection failed", err));
});

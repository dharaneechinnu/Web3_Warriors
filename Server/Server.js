require('dotenv').config();
const express= require("express");
const app = express();
const PORT = 3500||process.env.PORT
const mongoose = require('mongoose');
const cors = require("cors");
const path = require("path");


app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB)
   .then(()=>{console.log("DataBase Connect Successfully...")})
  .catch(err=>{
        console.log("Error in While connection  : ",err);
    })

app.use("/Auth",require("./Router/AuthRouter"))
app.use("/User",require("./Router/userRoutes"))
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files
app.use("/courses", require("./Router/courseRoutes"));



app.listen(PORT,()=>{
    console.log(`Server is running in PORT :${PORT}`);
});
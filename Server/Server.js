require('dotenv').config();
const express= require("express");
const app = express();
const PORT = 3500||process.env.PORT
const mongoose = require('mongoose');
const cors = require("cors");

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB)
   .then(()=>{console.log("DataBase Connect Successfully...")})
  .catch(err=>{
        console.log("Error in While connection  : ",err);
    })

app.use("/Auth",require("./Router/AuthRouter"))
app.use("/User",require("./Router/userRoutes"))




app.listen(PORT,()=>{
    console.log(`Server is running in PORT :${PORT}`);
});
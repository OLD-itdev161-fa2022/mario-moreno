import express from "express";
import connectDatabase from "./config/db";

//initialize express application
const app = express();

//connect database
connectDatabase();

//Configure Middleware
app.use(express.json({extended: false}));

//API endpoints
/** 
 * @route GET/
 * @desc Test end point
*/

app.get("/", (req, res) => 
    res.send("http get request sent to root api endpoint")
);

/** 
 * @route POST api/users 
 * @desc Register User
*/
app.post("api/users", (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

//connection listener
app.listen(3000, () => console.log("express server running on port 3000"));
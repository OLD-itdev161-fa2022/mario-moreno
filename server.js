import express from "express";
import connectDatabase from "./config/db";
import {check, validationResult} from "express-validator";
import jwt from "jsonwebtoken";
import config from "config";
import bcrypt from "bcryptjs";
import User from "./models/User";
import cors from "cors";
import auth from "./middleware/auth";

//initialize express application
const app = express();

//connect database
connectDatabase();

//Configure Middleware
app.use(express.json({extended: false}));
app.use(
    cors({
        origin: "http://localhost:3000"
    })
);

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
 * @desc Register user
*/
app.post("/api/users",
    [
        check("name", "Please enter your name").not().isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a password with 6 or more characters").isLength({min: 6})
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({errors: errors.array()});
        }else{
            const {name, email, password} = req.body;
            try {

                //check if user exist
                let user = await User.findOne({email: email});
                if (user) {
                    return res.status(400)
                    .json({errors: [{message: "User already exists."}]});
                }

                //creates new user
                user = new User({
                    name: name,
                    email: email,
                    password: password
                });

                //Encrypts password
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);

                //save user to db and return
                await user.save();
                
                //creates payload
                const payload = {
                    user:{
                        id: user.id
                    }
                };

                //checks token
                jwt.sign(payload, config.get("jwtSecret"),
                    {expiresIn: "10hr"},
                    (err, token) => {
                        if (err) throw err; 
                        res.json({token: token});
                    }
                );
                
            } catch (error){
                res.status(500).send("Server Error!");
            }
        }
    }
);

app.get("/api/auth", auth, async (req, res) =>{
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).send("Unknown server error");
        
    }
});

//connection listener
const port = 5000;
app.listen(port, () => console.log(`express server running on port ${port}`));
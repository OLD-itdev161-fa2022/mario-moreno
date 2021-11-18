import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {check, validationResult} from "express-validator";
import connectDatabase from "./config/db";
import config from "config";
import User from "./models/User";
import auth from "./middleware/auth";
import Post from "./models/Post";
import path from "path";

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
                    .json({errors: [{msg: "User already exists."}]});
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
                
                //Generate and return jwt token
               returnToken(user, res);
                
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

app.post("/api/login", 
[
    check("email", "Please enter a valid email").isEmail(),
    check("password", "A password is required").exists()
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }else{
            const {email, password} = req.body;
            try {
                //check if user exist
                let user = await User.findOne({email: email});
                if (!user) {
                    return res.status(400).json({errors: [{msg: "Invalid email or password"}]});
                }
                //check password
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return res.status(400).json({errors: [{msg: "Invalid email or password"}]});
                }

                //generate and return a jwt token
                returnToken(user, res);

            } catch (error) {
                res.status(500).send("Server Error.");
                
            }
        }
    }
);

const returnToken = (user, res) => {
    const payload = {
        user:{
        id: user.id
        }
    };

    jwt.sign(
        payload,
        config.get("jwtSecret"),
        {expiresIn: "10hr"},
        (err, token) => {
            if (err) throw err; 
            res.json({token: token});
        }
    );
}

app.post("/api/posts",
    [
        auth,
        [
            check("title", "Title text is required").not().isEmpty(),
            check("body", "Body text is required").not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        } else {
            const { title, body } = req.body;
            try{
                //get the user who created the post
                const user = await User.findById(req.user.id);

                //create a new post
                const post = new Post({
                    user: user.id,
                    title: title,
                    body: body
                });

                //save post to db and return
                await post.save();
                res.json(post);

            }catch(error){
                console.error(error);
                res.status(500).send("Server error");
            }
        }
    }
    
);

app.get("/api/posts", auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1});
        res.json(posts);
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
        
    }
});

app.get("/api/posts/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({msg: "Post not found."});
        }

        res.json(post);
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
        
    }
});

app.delete("/api/posts/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //make sure post exist
        if (!post) {
            return res.status(404).json({msg: "Post not found."});
        }

        //make sure the user created the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: "User not authorized."});
        }

        await post.remove();
        res.json({msg: "Post removed"});

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

app.put("/api/posts/:id", auth, async (req, res) => {
    try {
        const {title, body} = req.body;
        const post = await Post.findById(req.params.id);

        //make sure post exist
        if (!post) {
            return res.status(404).json({msg: "Post not found."});
        }

        //make sure the user created the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: "User not authorized."});
        }

        //update post and return
        post.title = title || post.title;
        post.body = body || post.body;

        await post.save();
        res.json(post);

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

//serve build files
if (process.env.NODE_ENV === "production") {
    //set the build folder
    app.use(express.static("client/build"));

    //route all the quests
    app.get("*", (req, res) =>{
        res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
    });
}


//connection listener
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`express server running on port ${port}`));
import jwt from "jsonwebtoken";
import config from "config";

const auth = (req, res) => {
    const token = req.header("x-auth-token");
    const secret = config.get("jwtSecret");

    if (!token) {
        return res
        .status(401)
        .json({message: "Missing authentication token. Authorization failed."});
    }

    try {
        const decodeToken = jwt.verify(token, secret);
        req.user = decodeToken.user;
        next();
        
    } catch (error) {
        res.status(401)
        .json({message: "Invalid authentication token. Authorization failed."})

    }
}

export default auth;
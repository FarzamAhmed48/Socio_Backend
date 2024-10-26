import jwt from "jsonwebtoken"
const isAuthenticated=(req,res,next)=>{
    try {
        const token=req.cookies.token;
        if(!token){
            res.send("You need to login first")
        }
        else{
            let decode=jwt.verify(token,process.env.SECRET_KEY);
            if(!decode){
                res.send("Something went wrong");
            }
            req.id=decode.userId
            next()
        }
    } catch (error) {
        console.log(error)
    }
}
export default isAuthenticated
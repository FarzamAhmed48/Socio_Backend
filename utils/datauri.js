import dataUriParser from "datauri/parser.js"
import path from "path"

const parser=new dataUriParser();
const dataUri=(file)=>{
    // console.log(file)
    let extname=path.extname(file.originalname.toString());
    // console.log(extname)
    return parser.format(extname,file.buffer).content
}

export default dataUri;
const validator = require("validator");

const validateSignUpData =(req)=>{
 const {firstname, lastname, email, password} = req.body;
    if(!firstname || !lastname){
        throw new Error("name is required");
        
    }else if(!validator.isEmail(email)){
        throw new Error("invalid email");
    }else if(!validator.isStrongPassword(password)){
        throw new Error("Please enter a strong password");
        
    }


}

module.exports = {
    validateSignUpData
}
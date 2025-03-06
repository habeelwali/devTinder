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

const validateEditProfileData= (data)=>{
    const Allowed_Updates = [
        "photoUrl",
        "firstname",
        "lastname",
        "gender",
        "about",
        "email",
        "skills",
      ];
      const updates = Object.keys(data).every((keys) =>
        Allowed_Updates.includes(keys)
      );

      return updates
  
    //   if (!updates) {
    //     throw new Error("UPDATE NOT ALLOWED");
    //   }
}



module.exports = {
    validateSignUpData, validateEditProfileData
}
const { default: mongoose } = require("mongoose");
const validator = require("validator");
const imageSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true,
        validate(value) {
            if (!validator.isURL(value)) {
              throw new Error("Invalid photo url");
            }
          },
     },
  publicId: { type: String, required: true },

},{timestamps:true})
module.exports = mongoose.model("Image", imageSchema);

const bcrypt = require("bcrypt");

const passwordToHash = "meyhouse123"; // your plain password

bcrypt.hash(passwordToHash, 10, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
  } else {
    console.log("Hashed password:", hash);
  }
});
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const { SECRET } = require("../config/db");

/**
 * Untuk mendaftarkan pengguna (ADMIN, SUPER_ADMIN, USER)
 */
const userRegister = async (userDets, role, res) => {
  try {
    // Validasi username
    let usernameNotTaken = await validateUsername(userDets.username);
    if (!usernameNotTaken) {
      return res.status(400).json({
        message: `Username sudah digunakan.`,
        success: false,
      });
    }

    // Validasi email
    let emailNotRegistered = await validateEmail(userDets.email);
    if (!emailNotRegistered) {
      return res.status(400).json({
        message: `Email sudah terdaftar.`,
        success: false,
      });
    }

    // Dapatkan password yang di-hash
    const password = await bcrypt.hash(userDets.password, 12);
    // Buat pengguna baru
    const newUser = new User({
      ...userDets,
      password,
      role,
    });

    await newUser.save();
    return res.status(201).json({
      message:
        "Selamat! Anda telah berhasil terdaftar. Silakan login sekarang.",
      success: true,
    });
  } catch (err) {
    // Implementasikan fungsi logger (winston)
    return res.status(500).json({
      message: "Tidak dapat membuat akun Anda.",
      success: false,
    });
  }
};

/**
 * Untuk Login pengguna (ADMIN, SUPER_ADMIN, USER)
 */
const userLogin = async (userCreds, role, res) => {
  let { username, password } = userCreds;
  // Periksa apakah username ada dalam database
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({
      message: "Username tidak ditemukan. Kredensial login tidak valid.",
      success: false,
    });
  }
  // Periksa peran pengguna
  if (user.role !== role) {
    return res.status(403).json({
      message: "Pastikan Anda login dari portal yang benar.",
      success: false,
    });
  }
  // Jika pengguna ada dan mencoba masuk dari portal yang benar
  // Sekarang periksa passwordnya
  let isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    // Buat dan kirim token ke pengguna
    let token = jwt.sign(
      {
        user_id: user._id,
        role: user.role,
        username: user.username,
        email: user.email,
      },
      SECRET,
      { expiresIn: "7 days" }
    );

    let result = {
      username: user.username,
      role: user.role,
      email: user.email,
      token: `Bearer ${token}`,
      expiresIn: 168,
    };

    return res.status(200).json({
      ...result,
      message: "Selamat! Anda sekarang berhasil masuk.",
      success: true,
    });
  } else {
    return res.status(403).json({
      message: "Password salah.",
      success: false,
    });
  }
};

const validateUsername = async (username) => {
  let user = await User.findOne({ username });
  return user ? false : true;
};

/**
 * Middleware Passport
 */
const userAuth = passport.authenticate("jwt", { session: false });

/**
 * Middleware Periksa Peran
 */
const checkRole = (roles) => (req, res, next) =>
  !roles.includes(req.user.role)
    ? res.status(401).json("Unauthorized")
    : next();

const validateEmail = async (email) => {
  let user = await User.findOne({ email });
  return user ? false : true;
};

const serializeUser = (user) => {
  return {
    username: user.username,
    email: user.email,
    name: user.name,
    _id: user._id,
    updatedAt: user.updatedAt,
    createdAt: user.createdAt,
  };
};

module.exports = {
  userAuth,
  checkRole,
  userLogin,
  userRegister,
  serializeUser,
};

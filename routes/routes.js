const express = require("express");
const router = express.Router();
const User = require("../models/users");
// import package multer để upload imgae
const multer = require("multer");
const fs = require("fs");
const { isNullOrUndefined } = require("util");
const { error } = require("console");
// image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});
// middleware upload
var upload = multer({
  storage: storage,
}).single("image");

// Route chèn một user vào database
router.post("/add", upload, async (req, res) => {
  try {
    const user = await new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: req.file.filename,
    }).save();
    req.session.message = {
      type: "success",
      message: "Thêm User thành công",
    };
    // Chuyển hướng về trang chủ
    res.redirect("/");
  } catch (err) {
    res.render("add_users", {
      title: "Thêm user",
      message: err.message,
    });
  }
});

// Route lấy tất cả các user

router.get("/", async (req, res) => {
  try {
    // console.log(req.query);

    // Tìm kiếm user
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      const users = await User.find({ name: searchRegex }).exec();
      return res.render("index", {
        title: "Trang Chủ",
        users: users,
        totalPages: "undefined",
        currentPage: "undefined",
      });
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 4;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / 4);

    const users = await User.find({}).limit(4).skip(skip).exec();

    res.render("index", {
      title: "Trang Chủ",
      users: users,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

router.get("/add", (req, res) => {
  res.render("add_users", { title: "Thêm User" });
});
// Route sửa user
router.get("/edit/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);
    res.render("edit_users", {
      title: "Sửa User",
      user: user,
    });
  } catch (err) {
    res.redirect("/");
  }
});

// Route cập nhật user
router.post("/update/:id", upload, async (req, res) => {
  try {
    let id = req.params.id;
    let new_image = "";
    if (req.file) {
      new_image = req.file.filename;
      fs.unlinkSync("./uploads/" + req.body.old_image);
    } else {
      new_image = req.body.old_image;
    }
    await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });
    req.session.message = {
      type: "success",
      message: "Cập nhật User thành công",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

// Route xóa user
router.get("/delete/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const userRemove = await User.findByIdAndDelete(id);
    if (userRemove.image !== "") {
      await fs.unlinkSync("./uploads/" + userRemove.image);
    }
    req.session.message = {
      type: "info",
      message: "Xóa User thành công",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

module.exports = router;

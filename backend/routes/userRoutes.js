import express from "express";
import {
  forgotPassword,
  login,
  protect,
  regiserCompany,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/company/register", regiserCompany);

// Protect all routes after this middleware
router.use(protect);

router.patch("/updateMyPassword", updatePassword);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);
// router.get("/me", userController.getMe, userController.getUser);
// router.patch("/updateMe", userController.updateMe);
// router.delete("/deleteMe", userController.deleteMe);
// router.get("/bookings", userController.getUserBookings);

router.use(restrictTo("SuperUser"));

// router
//   .route("/")
//   .get(userController.getAllUsers)
//   .post(userController.createUser);

// router
//   .route("/:id")
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);

export default router;

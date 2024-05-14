import {Router} from "express";
import {upload} from "../middlewares/multer.middleware.js";
import {
  changeCurrentPassword, getCurrentUser,
  loginUser,
  logoutUser,
  refreshTokenGenerator,
  registerUser, updateAccountDetails,
} from "../controllers/user.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1,
    }
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshTokenGenerator);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/get-user").post(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

export default router;
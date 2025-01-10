import crypto from "crypto";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import { User } from "../models/userModel.js";
import { Supplier } from "../models/suppliersModel.js";
import { Company } from "../models/companyModel.js";
import expressAsyncHandler from "express-async-handler";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";

// Function to create and send JWT token
const createSendToken = async (user, statusCode, res) => {
  const accessToken = await promisify(jwt.sign)(
    { id: user._id,
      role: user.role
     },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
  
  // console.log("creating token", accessToken, user);
  res.status(statusCode).json({
    status: "success",
    data: {
      user,
      accessToken,
    },
  });
};

// Signup controller
export const signup = expressAsyncHandler(async (req, res, next) => {
  const { username, password, phoneNumber, role, email } = req.body;
  // console.log(req.body);
  // Check if user already exists with the given username and email
  const existedUser = await User.findOne({
    username: username,
    email: email,
  });
  // console.log("EU",existedUser)

  if (existedUser) {
    return next(
      new AppError("User with this username and email already exists", 409),
      console.log("User with this username and email already exists")
    );
  }

  // console.log("next", );

  const newUser = await User.create({
    username,
    password,
    phoneNumber,
    role,
    email,
  });
  // console.log("NU",newUser);
  // Send the new user and accessToken to the frontend
  createSendToken(newUser, 201, res);
});


export const login = expressAsyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;
  console.log("login", email, password, role);

  // 1) Check if email, password, and role exist
  if (!email || !password || !role) {
    return next(new AppError("Please provide email, password, and role", 400));
  }

  let user;

  // 2) Query the correct collection based on the role
  if (role === "root") {
    user = await User.findOne({ email }).select("+password");
  } else if (role === "supplier") {
    user = await Supplier.findOne({ email }).select("+password");
  } else if (role === "company") {
    user = await Company.findOne({ email }).select("+password");
  } else {
    return next(new AppError("Invalid role provided", 400));
  }

  // 3) Check if user exists and if password is correct
  // if (!user || !(await user.correctPassword(password, user.password))) {
  //   return next(new AppError("Incorrect email or password", 401));
  // }

  // 4) Append role to user object
  user = { ...user.toObject(), role };

  // 5) Set req.user without the password field
  delete user.password;
  req.user = user;

  // 6) If everything is ok, send token to client
  createSendToken(user, 200, res);
});



export const regiserCompany = expressAsyncHandler(async (req, res, next) => {
  const { companyName, cinNo, address, email, officialPhoneNumber } =
    req.body;

  const existedCom = await User.findOne({
    companyName,
  });

  if (existedCom) {
    return next(
      new AppError("User with this username or email already exists", 409)
    );
  }

  // Create the unhashed password variable
  const unhashedPassword = "12345678";

  // Create new Company
  const newCompany = await Company.create({
    companyName,
    cinNo,
    address,
    email,
    officialPhoneNumber,
    password: unhashedPassword, // Store the unhashed password in the DB
  });

  // Send a response back with the new user and company
  res.status(201).json({
    status: "success",
    data: {
      company: newCompany,
    },
  });
});


export const protect = expressAsyncHandler(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    console.log("Authorization header is missing or incorrectly formatted");
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log("user", decoded)
  // 3) Check if user still exists
    let currentUser;

    // Check user based on role
    if (decoded.role === "supplier") {
      currentUser = await Supplier.findById(decoded.id);
    } else if (decoded.role === "root") {
      currentUser = await User.findById(decoded.id);
    } else if (decoded.role === "company") {
      currentUser = await Company.findById(decoded.id);
    } else {
      return next(new AppError("Invalid role found in the token", 401));
    }

    // If user not found
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

  // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError("User recently changed password! Please log in again.", 401)
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // console.log(req.user);
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const forgotPassword = expressAsyncHandler(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  // Continued from previous part...

  await user.save(); // Save user data even if validation is disabled

  try {
    //   await sendEmail({
    //     email: user.email,
    //     subject: "Your password reset token (valid for 10 min)",
    //     message,
    //   });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

export const resetPassword = expressAsyncHandler(async (req, res, next) => {
  // 1) Get token from params and password from body
  const { token } = req.params;
  const { password } = req.body;

  // 2) Verify the token and extract user _id
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your secret key
  } catch (error) {
    return next(new AppError("Invalid or expired token", 400));
  }
  console.log("decoded2", decoded);

  // const { id: userId } = decoded;

  // 3) Find the user by _id
 let user;

 // Check user based on role
 if (decoded.role === "supplier") {
   user = await Supplier.findById(decoded.id);
 } else if (decoded.role === "root") {
   user = await User.findById(decoded.id);
 } else if (decoded.role === "company") {
   user = await Company.findById(decoded.id);
 } else {
   return next(new AppError("Invalid role found in the token", 401));
 }

 // If user not found
 if (!user) {
   return next(
     new AppError("The user belonging to this token does no longer exist.", 401)
   );
 }
 console.log("password", user)
  // 4) Update the password and hash it
  user.password = await bcrypt.hash(password, 10);
  // user.ownPassword = true;
 console.log("password2", user);

  // 5) Save the updated user with new password
  await user.save();

  // 6) Send the token (you can update the `createSendToken` as per your logic)
  createSendToken(user, 200, res);
});

export const updatePassword = expressAsyncHandler(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select("+password");
  // console.log("ye hai user", user, "body", req.body.password);

  // let bool;
  // // 2) Check if POSTed current password is correct
  // if (!(bool = await user.correctPassword(req.body.password, user.password))) {
  //   console.log(req.body.password, user.password, bool, "bool");
  //   return next(new AppError("Your current password is wrong.", 401));
  // }

  // 3) If so, update password
  user.password = req.body.password;
  // console.log("pass", user.password);
  // user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto"; // Ensure you import crypto

const ENTITY_ENUM = ["ESG report", "Questions"];
const ACTIONS_ENUM = ["read", "create", "update", "delete"];

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 8,
      required: [true, "Password is required"],
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: function (v) {
          // Validator for phone number to ensure it contains only digits and is 10 digits long
          return /^\d{10}$/.test(v); // Regular expression for a 10-digit phone number
        },
        message: (props) =>
          `${props.value} is not a valid phone number! It should be 10 digits.`,
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    role: {
      type: String,
      enum: ["SuperUser"],
      required: true,
      trim: true,
    },
    permissions: [
      {
        entity: { type: String, enum: ENTITY_ENUM },
        actions: { type: [String], enum: ACTIONS_ENUM },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// // Virtual populate for Admin (company)
// userSchema.virtual("companyDetails", {
//   ref: "Company",
//   foreignField: "username",
//   localField: "username",
//   justOne: true,
//   select: "companyName",
// });

// Virtual populate for Supplier details in User schema
// userSchema.virtual("supplierDetails", {
//   ref: "Supplier",
//   foreignField: "username",
//   localField: "username",
//   justOne: true,
//   select: "companyName", // Ensure you are selecting the relevant fields
// });

// Password hashing and token generation methods remain the same
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // Store the unhashed password
    this.unhashedPassword = this.password;

    // Hash the password
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model("User", userSchema);

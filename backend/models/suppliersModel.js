/*
import mongoose, { Schema } from "mongoose";
import { User } from "./userModel.js";
import { calculateCategoryScoresAndGrade } from '../utils/esgScoreHelper.js';

// Define the Supplier schema
const supplierSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    SupplierCompName: {
      type: String,
      trim: true,
    },
    cinNo: {
      type: String,
      trim: true,
      unique: true, // CIN No should be unique
    },
    email: {
      type: String,
    },
    phone: {
      type: Number,
    },
    ownPassword: {
      type: Boolean,
    },
    unhashedPassword: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
    },
    total_revenue: {
      type: Number,
    },
    ESGScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    panCard: {
      type: String,
      trim: true,
    },
    GSTNo: {
      type: String,
      trim: true,
      unique: true, // GST No should also be unique
    },
    industry: {
      type: String,  // E.g., manufacturing, retail
      required: true,
    },
    location: {
      city: String,
      state: String,
      country: String,
    },
    sizeOfSupplier: {
      type: String,
      enum: ['Small', 'Medium', 'Large'], // Only these values are allowed
    },
    contactPerson: {
      type: String,
    },
    contactPerPos: {
      type: String,
    },
    ownershipType: {
      type: String, // public or private
    },
    percentageOfTotalSupply: {
      type: Number, // percentage
    },
    criticalityToOperations: {
      type: String,  // high, medium, low
    },
    lengthOfRelationship: {
      type: Number, // in years or months
    },
    relationshipQuality: {
      type: String, // e.g., excellent, good, satisfactory, needs improvement
    },
    reportingPeriod: {
      type: Number, // in months
    },
    suppliesTo: [
      {
        cinNo: {
          type: String,
          trim: true,
          ref: "Company", // Reference to the Company model
        },
      },
    ],
    questions: [
      {
        environment: {
          environmentalManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          climateChange: [
            {
              question: String,
              answer: String,
            },
          ],
          airPollution: [
            {
              question: String,
              answer: String,
            },
          ],
          hazardousMaterialManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          naturalResourceManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          wasteManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          regulatoryCompliance: [
            {
              question: String,
              answer: String,
            },
          ],
          pollutionPrevention: [
            {
              question: String,
              answer: String,
            },
          ],
        },
        social: {
          workerHealthSafety: [
            {
              question: String,
              answer: String,
            },
          ],
          humanRightsLabourPractices: [
            {
              question: String,
              answer: String,
            },
          ],
          regulatoryComplianceSocial: [
            {
              question: String,
              answer: String,
            },
          ],
          consumerSafetyProductSafety: [
            {
              question: String,
              answer: String,
            },
          ],
          communityInvolvement: [
            {
              question: String,
              answer: String,
            },
          ],
        },
        governance: {
          BoardStructureIndependenceAccountability: [
            {
              question: String,
              answer: String,
            },
          ],
          EthicsAndCodeofConduct: [
            {
              question: String,
              answer: String,
            },
          ],
          ESGManagementPracticesAndProcesses: [
            {
              question: String,
              answer: String,
            },
          ],
          supplyChainManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          dataPrivacySecurityManagement: [
            {
              question: String,
              answer: String,
            },
          ],
        },
        timePeriod: {
          type: Date,
          required: true, // Each entry will have its own time period
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// supplierSchema.post("save", async function (doc, next) {
//   try {
//     const user = await User.findOne({ username: doc.username });
//     if (user) {
//       user.supplier = doc._id;
//       await user.save();
//       console.log("User updated with supplier info:", user);
//     } else {
//       console.log("No user found with the username matching the supplier.");
//     }
//     next();
//   } catch (error) {
//     console.error("Error populating user with supplier info:", error);
//     next(error);
//   }
// });

supplierSchema.pre('save', async function (next) {
  if (this.isModified('questions')) {
    // If questions are modified, recalculate the ESG score
    const esgScore = calculateCategoryScoresAndGrade(this);
    this.ESGScore = esgScore; // Update the ESGScore field
  }
  next();
});


export const Supplier = mongoose.model("Supplier", supplierSchema);
*/









import mongoose, { Schema } from "mongoose";
import { User } from "./userModel.js";
import { calculateCategoryScoresAndGrade } from '../utils/esgScoreHelper.js';

// Validation functions
const validateCIN = (cin) => /^[A-Z]{1}[A-Z\d]{5}\d{21}$/.test(cin); // Regex for CIN validation (21-digit alphanumeric)
const validatePAN = (pan) => /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan); // Regex for PAN validation (10-digit alphanumeric)
const validateGST = (gst) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst); // Regex for GSTIN validation (15-digit alphanumeric)
const validatePhoneNumber = (phone) => /^[6-9]\d{9}$/.test(phone); // Regex for Indian phone numbers (10 digits starting with 6-9)

const industryEnum = [
  "Automotive",
  "Electronics",
  "Food & Beverage",
  "Chemicals",
  "Textiles",
  "Pharmaceuticals",
  "Machinery",
  "Grocery",
  "Electronics",
  "Apparel",
  "Home Goods",
  "Automotive",
  "Department Stores",
  "Online Retail",
  "IT & Software",
  "Consulting",
  "Healthcare",
  "Education",
  "Finance & Insurance",
  "Hospitality",
  "Logistics",
  "Residential",
  "Commercial",
  "Infrastructure",
  "Heavy Construction",
  "Crops",
  "Livestock",
  "Fisheries",
  "Forestry",
  "Others"
];

// Define the Supplier schema
const supplierSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    SupplierCompName: {
      type: String,
      trim: true,
    },
    cinNo: {
      type: String,
      trim: true,
      unique: true, // CIN No should be unique
      // validate: {
      //   validator: validateCIN,
      //   message: "CIN should be a 21-digit alphanumeric code."
      // },
    },
    email: {
      type: String,
      validate: {
        validator: (email) => {
          return /^\S+@\S+\.\S+$/.test(email); // Simple email validation regex
        },
        message: "Please provide a valid email address.",
      },
    },
    phone: {
      type: Number,
      // validate: {
      //   validator: validatePhoneNumber,
      //   message: "Please provide a valid phone number."
      // }
    },
    ownPassword: {
      type: Boolean,
    },
    unhashedPassword: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
    },
    total_revenue: {
      type: String,
      enum: [
        "< 50 Lakh",
        "50 lakh - 1 crore",
        "1 crore - 5 crore",
        "5 crore - 10 crore",
        "10 crore - 20 crore",
        "< 20 crore",
      ],
      required: true,
    },
    ESGScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    panCard: {
      type: String,
      trim: true,
    // validate: {
    //   validator: validatePAN,
    //   message: "PAN should be a 10-digit alphanumeric code."
    // }
    },
    GSTNo: {
      type: String,
      trim: true,
      unique: true, // GST No should also be unique
      // validate: {
      //   validator: validateGST,
      //   message: "GSTIN should be a 15-digit alphanumeric code."
      // },
    },
    industry: {
      type: String,
      enum: industryEnum,
      required: true,
    },
    location: {
      city: String,
      state: String,
      country: String,
    },
    sizeOfSupplier: {
      type: String,
      enum: ["Small", "Medium", "Large"], // Only these values are allowed
    },
    contactperson: {
      name: { type: String },
      position: { type: String },
    },
    contactPerPos: {
      type: String,
    },
    ownershipType: {
      type: String,
      enum: [
        "Sole Proprietorship",
        "General Partnership",
        "Limited Partnership",
        "Limited Liability Partnership (LLP)",
        "Private Limited Company (Pvt Ltd)",
        "Public Limited Company (Ltd)",
        "One Person Company (OPC)",
        "Cooperative Society",
        "Trust",
        "Non-Profit Organization (NGO)",
      ],
    },
    percentageOfTotalSupply: {
      type: Number, // percentage
    },
    criticalityToOperations: {
      type: String,
      enum: ["High", "Medium", "Low"],
    },
    lengthOfRelationship: {
      type: Number, // in years or months
    },
    relationshipQuality: {
      type: String,
      enum: ["Excellent", "Good", "Satisfactory", "Needs Improvement"],
    },
    reportingPeriod: {
      type: Number, // in months
    },
    suppliesTo: [
      {
        cinNo: {
          type: String,
          trim: true,
          ref: "Company", // Reference to the Company model
        },
      },
    ],
    questions: [
      {
        environment: {
          environmentalManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          climateChange: [
            {
              question: String,
              answer: String,
            },
          ],
          airPollution: [
            {
              question: String,
              answer: String,
            },
          ],
          hazardousMaterialManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          naturalResourceManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          wasteManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          regulatoryCompliance: [
            {
              question: String,
              answer: String,
            },
          ],
          pollutionPrevention: [
            {
              question: String,
              answer: String,
            },
          ],
        },
        social: {
          workerHealthSafety: [
            {
              question: String,
              answer: String,
            },
          ],
          humanRightsLabourPractices: [
            {
              question: String,
              answer: String,
            },
          ],
          regulatoryComplianceSocial: [
            {
              question: String,
              answer: String,
            },
          ],
          consumerSafetyProductSafety: [
            {
              question: String,
              answer: String,
            },
          ],
          communityInvolvement: [
            {
              question: String,
              answer: String,
            },
          ],
        },
        governance: {
          BoardStructureIndependenceAccountability: [
            {
              question: String,
              answer: String,
            },
          ],
          EthicsAndCodeofConduct: [
            {
              question: String,
              answer: String,
            },
          ],
          ESGManagementPracticesAndProcesses: [
            {
              question: String,
              answer: String,
            },
          ],
          supplyChainManagement: [
            {
              question: String,
              answer: String,
            },
          ],
          dataPrivacySecurityManagement: [
            {
              question: String,
              answer: String,
            },
          ],
        },
        timePeriod: {
          type: Date,
          required: true, // Each entry will have its own time period
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

supplierSchema.pre('save', async function (next) {
  if (this.isModified('questions')) {
    // If questions are modified, recalculate the ESG score
    const esgScore = calculateCategoryScoresAndGrade(this);
    this.ESGScore = esgScore; // Update the ESGScore field
  }
  next();
});

export const Supplier = mongoose.model("Supplier", supplierSchema);

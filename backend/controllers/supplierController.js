import { User } from "../models/userModel.js";
import { Supplier } from "../models/suppliersModel.js";
import expressAsyncHandler from "express-async-handler";
import AppError from "../utils/appError.js";
import multer from "multer";
import xlsx from "xlsx";
import { calculateCategoryScoresAndGrade, calculateCategoryScore, calculateSubcategoryScore } from "../utils/esgScoreHelper.js";
import { Company } from "../models/companyModel.js";
import { assignGrade } from "../utils/esgScoreHelper.js";

// Update supplier information
export const updateSupplierInfo = expressAsyncHandler(
  async (req, res, next) => {
    const {      
      SupplierCompName,
      cinNo,
      username,
      address,
      total_revenue,
      panCard,
      GSTNo,
      industry,
      location,
      sizeOfSupplier,
      contactPerson,
      ownershipType,
      percentageOfTotalSupply,
      criticalityToOperations,
      lengthOfRelationship,
      relationshipQuality,
      reportingPeriod,
      suppliesTo,
    } = req.body;

    // 1. Check if the username is provided
    if (!username) {
      return next(new AppError("Username is required", 400));
    }

    // 2. Check if at least one supplier information field is provided
    if (
      !SupplierCompName &&
      !cinNo &&
      !address &&
      !total_revenue &&
      !panCard &&
      !GSTNo &&
      !industry &&
      !location &&
      !sizeOfSupplier &&
      !contactPerson &&
      !ownershipType &&
      !percentageOfTotalSupply &&
      !criticalityToOperations &&
      !lengthOfRelationship &&
      !relationshipQuality &&
      !reportingPeriod &&
      !suppliesTo
    ) {
      return next(
        new AppError(
          "At least one field must be provided to update or create supplier",
          400
        )
      );
    }

    try {
      // 3. Check if supplier with the username exists
      let supplier = await Supplier.findOne({ username });

      if (supplier) {
        // 4. Update supplier if it exists
        if (SupplierCompName !== undefined) supplier.SupplierCompName = SupplierCompName;
        if (cinNo !== undefined) supplier.cinNo = cinNo;
        if (address !== undefined) supplier.address = address;
        if (total_revenue !== undefined) supplier.total_revenue = total_revenue;
        if (panCard !== undefined) supplier.panCard = panCard;
        if (GSTNo !== undefined) supplier.GSTNo = GSTNo;
        if (industry !== undefined) supplier.industry = industry;
        if (location !== undefined) supplier.location = location;
        if (sizeOfSupplier !== undefined)
          supplier.sizeOfSupplier = sizeOfSupplier;
        if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
        if (ownershipType !== undefined) supplier.ownershipType = ownershipType;
        if (percentageOfTotalSupply !== undefined)
          supplier.percentageOfTotalSupply = percentageOfTotalSupply;
        if (criticalityToOperations !== undefined)
          supplier.criticalityToOperations = criticalityToOperations;
        if (lengthOfRelationship !== undefined)
          if (lengthOfRelationship !== undefined)
            supplier.lengthOfRelationship = lengthOfRelationship;
        if (relationshipQuality !== undefined)
          supplier.relationshipQuality = relationshipQuality;
        if (reportingPeriod !== undefined)
          supplier.reportingPeriod = reportingPeriod;
        if (suppliesTo !== undefined) supplier.suppliesTo = suppliesTo;

        // Check if all fields are set to update `allData` in the user document
        if (
          address &&
          total_revenue &&
          panCard &&
          GSTNo &&
          industry &&
          location &&
          sizeOfSupplier &&
          contactPerson &&
          ownershipType &&
          percentageOfTotalSupply &&
          criticalityToOperations &&
          lengthOfRelationship &&
          relationshipQuality &&
          reportingPeriod &&
          suppliesTo
        ) {
          const user = await User.findOne({ username });
          if (user) {
            user.allData = true;
            await user.save();
          }
        }

        await supplier.save(); // Save the updated supplier document

        // 6. Return the updated supplier and user in the response
        const user = await User.findOne({ username });
        return res.status(201).json({
          status: "success",
          data: {
            supplier,
            user,
          },
        });
      }

      // 7. If supplier does not exist, create a new one
      supplier = await Supplier.create({
        SupplierCompName,
        cinNo,
        username,
        address,
        total_revenue,
        panCard,
        GSTNo,
        industry,
        location,
        sizeOfSupplier,
        contactPerson,
        ownershipType,
        percentageOfTotalSupply,
        criticalityToOperations,
        lengthOfRelationship,
        relationshipQuality,
        reportingPeriod,
        suppliesTo,
      });

      // 8. After creating the supplier, find the user and update `allData`
      const user = await User.findOne({ username });
      if (user) {
        user.allData = true;
        await user.save();
      }

      // 9. Return the newly created supplier and the updated user in the response
      return res.status(201).json({
        status: "success",
        data: {
          supplier,
          user,
        },
      });
    } catch (error) {
      // 10. Handle database errors or unexpected issues
      console.log("error", error, error.message);
      return next(
        new AppError(
          "Error updating or creating supplier. Please try again later.",
          500
        )
      );
    }
  }
);

// Add supplier question
export const addSupplierQuestion = expressAsyncHandler(
  async (req, res, next) => {
    const { dataToSend, username, timePeriod } = req.body;
    console.log("yha par hai", dataToSend, username, timePeriod);

    // Find supplier by username
    const supplier = await Supplier.findOne({ username });

    if (!supplier) {
      return next(new AppError("Supplier with this username not found", 404));
    }

    // Transform dataToSend to match the expected structure
    const newEntry = {
      environment: {
        environmentalManagement:
          dataToSend.environmental.environmentalManagement.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        climateChange: dataToSend.environmental.climateChange.map((q) => ({
          question: q.question,
          answer: q.answer.toString(),
        })),
        airPollution: dataToSend.environmental.airPollution.map((q) => ({
          question: q.question,
          answer: q.answer.toString(),
        })),
        hazardousMaterialManagement:
          dataToSend.environmental.hazardousMaterialManagement.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        naturalResourceManagement:
          dataToSend.environmental.naturalResourceManagement.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        wasteManagement: dataToSend.environmental.wasteManagement.map((q) => ({
          question: q.question,
          answer: q.answer.toString(),
        })),
        regulatoryCompliance: dataToSend.environmental.regulatoryCompliance.map(
          (q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })
        ),
        pollutionPrevention: dataToSend.environmental.pollutionPrevention.map(
          (q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })
        ),
      },
      social: {
        workerHealthSafety: dataToSend.social.workerHealthSafety.map((q) => ({
          question: q.question,
          answer: q.answer.toString(),
        })),
        humanRightsLabourPractices:
          dataToSend.social.humanRightsLabourPractices.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        regulatoryComplianceSocial:
          dataToSend.social.regulatoryComplianceSocial.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        consumerSafetyProductSafety:
          dataToSend.social.consumerSafetyProductSafety.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        communityInvolvement: dataToSend.social.communityInvolvement.map(
          (q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })
        ),
      },
      governance: {
        BoardStructureIndependenceAccountability:
          dataToSend.governance.BoardStructureIndependenceAccountability.map(
            (q) => ({
              question: q.question,
              answer: q.answer.toString(),
            })
          ),
        EthicsAndCodeofConduct:
          dataToSend.governance.EthicsAndCodeofConduct.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        ESGManagementPracticesAndProcesses:
          dataToSend.governance.ESGManagementPracticesAndProcesses.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
        supplyChainManagement: dataToSend.governance.supplyChainManagement.map(
          (q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })
        ),
        dataPrivacySecurityManagement:
          dataToSend.governance.dataPrivacySecurityManagement.map((q) => ({
            question: q.question,
            answer: q.answer.toString(),
          })),
      },
      timePeriod: new Date(timePeriod), // Ensure this is stored as a date
    };

    // Add the new entry to the questions array
    supplier.questions.push(newEntry);
    console.log("newEntry", newEntry);

    // Save the supplier with the new questions entry
    await supplier.save();

    // Send a response back with the updated supplier
    res.status(201).json({
      status: "success",
      data: {
        supplier,
      },
    });
  }
);

// Update supplier ESG score
export const updateSupplierESGScore = async (req, res) => {
  try {
    const username = req.params.username;
    const supplier = await Supplier.findOne({ username });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Get the most recent questions submission by sorting the array by timePeriod
    const mostRecentSubmission = supplier.questions.sort(
      (a, b) => new Date(b.timePeriod) - new Date(a.timePeriod)
    )[0];

    if (!mostRecentSubmission) {
      return res
        .status(400)
        .json({ message: "No submissions found for this supplier" });
    }

    // Calculate ESG scores based on the most recent submission
    const {
      businessScore,
      industryScore,
      environmentalScore,
      socialScore,
      governanceScore,
      overallESGScore,
    } = calculateCategoryScoresAndGrade(mostRecentSubmission);

    // Save the overall ESG score into the supplier document
    supplier.ESGScore = overallESGScore;
    await supplier.save();

    // Respond with the updated scores and grades
    res.status(200).json({
      message: "Supplier ESG score updated",
      scores: {
        business: { score: businessScore, grade: assignGrade(businessScore) },
        industry: { score: industryScore, grade: assignGrade(industryScore) },
        environmental: {
          score: environmentalScore,
          grade: assignGrade(environmentalScore),
        },
        social: { score: socialScore, grade: assignGrade(socialScore) },
        governance: {
          score: governanceScore,
          grade: assignGrade(governanceScore),
        },
        overall: { score: overallESGScore },
      },
    });
  } catch (error) {
    console.error("Error updating supplier ESG score:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to recalculate and update the ESG score
// export const recalculateESGScore = async (req, res) => {
//   try {
//     const supplierId = req.params.id;
//     const supplier = await Supplier.findById(supplierId);

//     if (!supplier) {
//       return res.status(404).json({ message: "Supplier not found" });
//     }

//     // Calculate ESG scores for each category
//     const {
//       businessScore,
//       industryScore,
//       environmentalScore,
//       socialScore,
//       governanceScore,
//       overallESGScore,
//     } = calculateCategoryScoresAndGrade(supplier);

//     // Update the overall ESG score in the database
//     supplier.ESGScore = overallESGScore;
//     await supplier.save();

//     // Respond with the updated scores and grades
//     res.status(200).json({
//       message: "Supplier ESG score recalculated and updated",
//       scores: {
//         business: { score: businessScore, grade: assignGrade(businessScore) },
//         industry: { score: industryScore, grade: assignGrade(industryScore) },
//         environmental: {
//           score: environmentalScore,
//           grade: assignGrade(environmentalScore),
//         },
//         social: { score: socialScore, grade: assignGrade(socialScore) },
//         governance: {
//           score: governanceScore,
//           grade: assignGrade(governanceScore),
//         },
//         overall: { score: overallESGScore },
//       },
//     });
//   } catch (error) {
//     console.error("Error recalculating ESG score:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// Controller to fetch supplier ESG scores for frontend
export const getSupplierESGScores = expressAsyncHandler(async (req, res) => {
  try {
    const { username } = req.query;

    const supplier = await Supplier.aggregate([
      { $match: { username } },
      {
        $project: {
          _id: 0,
          "environment.environmentalManagement": { $arrayElemAt: ["$questions.environment.environmentalManagement", 0] },
          "environment.climateChange": { $arrayElemAt: ["$questions.environment.climateChange", 0] },
          "environment.airPollution": { $arrayElemAt: ["$questions.environment.airPollution", 0] },
          "environment.hazardousMaterialManagement": { $arrayElemAt: ["$questions.environment.hazardousMaterialManagement", 0] },
          "environment.naturalResourceManagement": { $arrayElemAt: ["$questions.environment.naturalResourceManagement", 0] },
          "environment.wasteManagement": { $arrayElemAt: ["$questions.environment.wasteManagement", 0] },
          "environment.regulatoryCompliance": { $arrayElemAt: ["$questions.environment.regulatoryCompliance", 0] },
          "environment.pollutionPrevention": { $arrayElemAt: ["$questions.environment.pollutionPrevention", 0] },
          "social.workerHealthSafety": { $arrayElemAt: ["$questions.social.workerHealthSafety", 0] },
          "social.humanRightsLabourPractices": { $arrayElemAt: ["$questions.social.humanRightsLabourPractices", 0] },
          "social.regulatoryComplianceSocial": { $arrayElemAt: ["$questions.social.regulatoryComplianceSocial", 0] },
          "social.consumerSafetyProductSafety": { $arrayElemAt: ["$questions.social.consumerSafetyProductSafety", 0] },
          "social.communityInvolvement": { $arrayElemAt: ["$questions.social.communityInvolvement", 0] },
          "governance.BoardStructureIndependenceAccountability": { $arrayElemAt: ["$questions.governance.BoardStructureIndependenceAccountability", 0] },
          "governance.EthicsAndCodeofConduct": { $arrayElemAt: ["$questions.governance.EthicsAndCodeofConduct", 0] },
          "governance.ESGManagementPracticesAndProcesses": { $arrayElemAt: ["$questions.governance.ESGManagementPracticesAndProcesses", 0] },
          "governance.supplyChainManagement": { $arrayElemAt: ["$questions.governance.supplyChainManagement", 0] },
          "governance.dataPrivacySecurityManagement": { $arrayElemAt: ["$questions.governance.dataPrivacySecurityManagement", 0] },
        },
      },
    ]);

    if (!supplier || supplier.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const supplierData = supplier[0];

    const environmentalScore = calculateCategoryScore([
      ...supplierData.environment.environmentalManagement,
      ...supplierData.environment.climateChange,
      ...supplierData.environment.airPollution,
      ...supplierData.environment.hazardousMaterialManagement,
      ...supplierData.environment.naturalResourceManagement,
      ...supplierData.environment.wasteManagement,
      ...supplierData.environment.regulatoryCompliance,
      ...supplierData.environment.pollutionPrevention,
    ]);

    const socialScore = calculateCategoryScore([
      ...supplierData.social.workerHealthSafety,
      ...supplierData.social.humanRightsLabourPractices,
      ...supplierData.social.regulatoryComplianceSocial,
      ...supplierData.social.consumerSafetyProductSafety,
      ...supplierData.social.communityInvolvement,
    ]);

    const governanceScore = calculateCategoryScore([
      ...supplierData.governance.BoardStructureIndependenceAccountability,
      ...supplierData.governance.EthicsAndCodeofConduct,
      ...supplierData.governance.ESGManagementPracticesAndProcesses,
      ...supplierData.governance.supplyChainManagement,
      ...supplierData.governance.dataPrivacySecurityManagement,
    ]);

    const businessScore = (environmentalScore + socialScore + governanceScore) / 3;
    const industryScore = 75;
    const overallESGScore = (businessScore + industryScore + environmentalScore + socialScore + governanceScore) / 5;

    const environmentSubcategoryScores = {
      environmentalManagement: calculateSubcategoryScore(supplierData.environment.environmentalManagement, environmentalScore),
      climateChange: calculateSubcategoryScore(supplierData.environment.climateChange, environmentalScore),
      naturalResourceManagement: calculateSubcategoryScore(supplierData.environment.naturalResourceManagement, environmentalScore),
      wasteManagement: calculateSubcategoryScore(supplierData.environment.wasteManagement, environmentalScore),
      regulatoryCompliance: calculateSubcategoryScore(supplierData.environment.regulatoryCompliance, environmentalScore),
      pollutionPrevention: calculateSubcategoryScore(supplierData.environment.pollutionPrevention, environmentalScore),
    };

    const socialSubcategoryScores = {
      workerHealthSafety: calculateSubcategoryScore(supplierData.social.workerHealthSafety, socialScore),
      humanRightsLabourPractices: calculateSubcategoryScore(supplierData.social.humanRightsLabourPractices, socialScore),
      regulatoryComplianceSocial: calculateSubcategoryScore(supplierData.social.regulatoryComplianceSocial, socialScore),
      communityInvolvement: calculateSubcategoryScore(supplierData.social.communityInvolvement, socialScore),
    };

    const governanceSubcategoryScores = {
      supplyChainManagement: calculateSubcategoryScore(supplierData.governance.supplyChainManagement, governanceScore),
      ESGManagementPracticesAndProcesses: calculateSubcategoryScore(supplierData.governance.ESGManagementPracticesAndProcesses, governanceScore),
      EthicsAndCodeofConduct: calculateSubcategoryScore(supplierData.governance.EthicsAndCodeofConduct, governanceScore),
      BoardStructureIndependenceAccountability: calculateSubcategoryScore(supplierData.governance.BoardStructureIndependenceAccountability, governanceScore),
    };

    res.status(200).json({
      scores: {
        business: { score: businessScore, grade: assignGrade(businessScore) },
        industry: { score: industryScore, grade: assignGrade(industryScore) },
        environmental: {
          score: environmentalScore,
          grade: assignGrade(environmentalScore),
          subcategories: environmentSubcategoryScores,
        },
        social: {
          score: socialScore,
          grade: assignGrade(socialScore),
          subcategories: socialSubcategoryScores,
        },
        governance: {
          score: governanceScore,
          grade: assignGrade(governanceScore),
          subcategories: governanceSubcategoryScores,
        },
        overall: {
          score: overallESGScore,
          grade: assignGrade(overallESGScore),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching ESG scores:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


const storage = multer.memoryStorage();
const uploadF = multer({ storage }).single("file");

// Upload function
export const upload = expressAsyncHandler(async (req, res, next) => {
  // Ensure multer has stored the file in memory
  uploadF(req, res, async (err) => {
    if (err) {
      return next(new AppError("File upload failed", 400));
    }

    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    try {
      // Read the Excel file from the buffer (uploaded in memory)
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0]; // Assuming we're dealing with the first sheet
      const worksheet = workbook.Sheets[sheetName];

      // Convert the sheet to JSON format
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      console.log("worksheet", jsonData);

      // Iterate through each row in the JSON data and map it to the Supplier schema
      for (const row of jsonData) {
        const {
          "Supplier Name": SupplierCompName,
          Industry: industry,
          Location: location,
          "Size of the Supplier": sizeOfSupplier,
          "Contact Person": contactPerson,
          "Contact Person Position": contactPerPos,
          "Email Address": email,
          "Phone Number": phone,
          GSTIN: GSTNo,
          "Ownership Type": ownershipType,
          "Percentage of Total Supply": percentageOfTotalSupply,
          "Revenue Contribution": total_revenue,
          "Criticality to Operations": criticalityToOperations,
          "Length of Relationship": lengthOfRelationship,
          "Supplier-Parent Company Relationship": relationshipQuality,
          "Reporting Period": reportingPeriod,
          SupplierTo: suppliesToRaw, // Extract the suppliesTo field (comma-separated CIN numbers)
          "CIN Number": cinNo, // Extract the CIN number of the supplier itself
        } = row;

        // Split location into city, state, and country
        const [city, state, country] = location
          ? location.split(",")
          : ["", "", ""];

        // Create a password variable
        const password = "12345678";

        // Generate a username by converting the SupplierCompName to lowercase and removing spaces
        const username = SupplierCompName.replace(/\s+/g, "").toLowerCase();

        // Process the suppliesTo field: split by commas and map to an array of objects with the cinNo key
        const suppliesTo = suppliesToRaw
          ? suppliesToRaw.split(",").map((cin) => ({
              cinNo: cin.trim(), // Create an object for each CIN No
            }))
          : [];

        // Create a new Supplier object and save it to the database
        const newSupplier = new Supplier({
          username, // Set the username as the processed SupplierCompName
          SupplierCompName,
          email,
          phone,
          total_revenue,
          industry,
          sizeOfSupplier,
          contactPerson,
          contactPerPos,
          ownershipType,
          percentageOfTotalSupply,
          criticalityToOperations,
          lengthOfRelationship,
          GSTNo,
          cinNo, // Add the cinNo to the new supplier document
          location: {
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
          },
          relationshipQuality,
          reportingPeriod,
          suppliesTo, // Storing the suppliesTo array of objects with the cinNo key
          password, // Storing the default password
        });

        // Save the supplier to the database
        await newSupplier.save();
      }

      // Send a success response once all rows are saved
      res.status(200).json({ message: "Suppliers uploaded successfully" });
    } catch (error) {
      console.error("Error saving supplier to database:", error); // Log the actual error
      return next(new AppError("Failed to process the file", 500));
    }
  });
});









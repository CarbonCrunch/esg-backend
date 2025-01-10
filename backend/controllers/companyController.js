import {User} from "../models/userModel.js";
import {Supplier} from "../models/suppliersModel.js";
import expressAsyncHandler from "express-async-handler";
import AppError from "../utils/appError.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import {calculateCategoryScoresAndGrade} from "../utils/esgScoreHelper.js";
import {Company} from "../models/companyModel.js";
import {assignGrade} from "../utils/esgScoreHelper.js";


export const getSuppliersForCompany = async (req, res) => {
  try {
      const { cinNo } = req.query;

      console.log('Extracted CIN No:', cinNo);

      // Find all suppliers where any object in suppliesTo array has a matching cinNo
      const suppliers = await Supplier.find({
          suppliesTo: {
              $elemMatch: {
                  cinNo: cinNo,
              },
          },
      }).select(
          'SupplierCompName username location ESGScore email phone total_revenue panCard GSTNo industry sizeOfSupplier contactPerson contactPerPos ownershipType percentageOfTotalSupply criticalityToOperations lengthOfRelationship relationshipQuality reportingPeriod'
      );

      if (!suppliers || suppliers.length === 0) {
          return res.status(404).json({
              message: `No suppliers found for the company with CIN "${cinNo}".`,
          });
      }

      // Calculate average ESG score
      const totalESGScore = suppliers.reduce((sum, supplier) => sum + (supplier.ESGScore || 0), 0);
      const avgESGScore = totalESGScore / suppliers.length;

      // Sort suppliers by ESG score to get top and bottom performers
      const sortedSuppliers = [...suppliers].sort((a, b) => b.ESGScore - a.ESGScore);
      const top3Suppliers = sortedSuppliers.slice(0, 3);
      const bottom3Suppliers = sortedSuppliers.slice(-3);

      // Map supplier data to send to the frontend
      const supplierData = suppliers.map((supplier) => ({
          id: supplier._id,
          name: supplier.SupplierCompName,
          username: supplier.username,
          cinNo: supplier.cinNo, // Ensure cinNo is included
          location: `${supplier.location.city}, ${supplier.location.state}, ${supplier.location.country}`,
          ESGScore: supplier.ESGScore,
          email: supplier.email,
          phone: supplier.phone,
          totalRevenue: supplier.total_revenue,
          panCard: supplier.panCard,
          GSTNo: supplier.GSTNo,
          industry: supplier.industry,
          sizeOfSupplier: supplier.sizeOfSupplier,
          contactPerson: supplier.contactPerson,
          contactPerPos: supplier.contactPerPos,
          ownershipType: supplier.ownershipType,
          percentageOfTotalSupply: supplier.percentageOfTotalSupply,
          criticalityToOperations: supplier.criticalityToOperations,
          lengthOfRelationship: supplier.lengthOfRelationship,
          relationshipQuality: supplier.relationshipQuality,
          reportingPeriod: supplier.reportingPeriod,
      }));

      // Console log all supplier data
      console.log('Fetched Supplier Details:', supplierData);

      // Return the response with all supplier details, average ESG score, top 3, and bottom 3 suppliers
      return res.status(200).json({
          suppliers: supplierData,
          totalSuppliers: supplierData.length,
          avgESGScore: avgESGScore,
          top3Suppliers: top3Suppliers.map(s => ({
              name: s.SupplierCompName,
              ESGScore: s.ESGScore,
          })),
          bottom3Suppliers: bottom3Suppliers.map(s => ({
              name: s.SupplierCompName,
              ESGScore: s.ESGScore,
          })),
      });
  } catch (error) {
      console.error('Error fetching suppliers:', error);
      return res.status(500).json({
          message: 'Server error occurred while fetching suppliers.',
      });
  }
};

export const addSupplierToCompany = expressAsyncHandler(async (req, res, next) => {
  const { user, newSupplier } = req.body;

  const {
      SupplierCompName,
      cinNo,
      address,
      total_revenue,
      panCard,
      email,
      phone,
      GSTNo,
      industry,
      location, // Comma-separated string: "Delhi, State, India"
      sizeOfSupplier,
      contactPerson,
      contactPerPos,
      ownershipType,
      percentageOfTotalSupply,
      criticalityToOperations,
      lengthOfRelationship,
      relationshipQuality,
      reportingPeriod,
  } = newSupplier;

  // Split location into city, state, and country
  const [city = "", state = "", country = ""] = location ? location.split(",").map(part => part.trim()) : ["", "", ""];

  try {
      // Validate required fields
      if (!SupplierCompName || !cinNo || !GSTNo) {
          return next(new AppError("Supplier name, CIN number, and GST number are required", 400));
      }

      // Check if the supplier with the given GSTNo already exists
      let supplier = await Supplier.findOne({ GSTNo });
      if (supplier) {
          return next(new AppError("Supplier with this GST number already exists", 400));
      }

      // Get the logged-in company's CIN number from user object
      const companyCIN = user.cinNo;

      // Generate username by converting SupplierCompName to lowercase and removing spaces
      const username = SupplierCompName.replace(/\s+/g, "").toLowerCase();

      // Generate random password (you can adjust the length and format as needed)
      const generatedPassword = crypto.randomBytes(6).toString('hex'); // e.g., "a3d9e1f4b9"

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(generatedPassword, 12);

      // Create a new supplier object with split location details and password fields
      supplier = new Supplier({
          username,
          SupplierCompName,
          cinNo, // Supplier CIN number
          address,
          total_revenue,
          panCard,
          email,
          phone,
          GSTNo,
          industry,
          location: {
              city,
              state,
              country,
          }, // Store the location as an object
          sizeOfSupplier,
          contactPerson,
          contactPerPos,
          ownershipType,
          percentageOfTotalSupply,
          criticalityToOperations,
          lengthOfRelationship,
          relationshipQuality,
          reportingPeriod,
          suppliesTo: [{ cinNo: companyCIN }], // Add the logged-in company's CIN number to suppliesTo
          password: hashedPassword, // Save the hashed password
          unhashedPassword: generatedPassword, // Save the unhashed password
      });

      // Save the supplier to the database
      await supplier.save();

      // Email the supplier their credentials
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const mailOptions = {
          from: `Carbon Crunch <${process.env.EMAIL_USER}>`,
          to: email, // Supplier's email
          subject: 'Your Supplier Account Credentials',
          html: `
              <html>
                  <body style="font-family: Arial, sans-serif; color: #333;">
                      <h2 style="color: #4CAF50;">Hello ${SupplierCompName},</h2>
                      <p>Your account has been created successfully. Here are your credentials:</p>
                      <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                              <th style="text-align: left; padding: 8px; background-color: #f2f2f2;">Username</th>
                              <td style="padding: 8px; border: 1px solid #ddd;">${username}</td>
                          </tr>
                          <tr>
                              <th style="text-align: left; padding: 8px; background-color: #f2f2f2;">Password</th>
                              <td style="padding: 8px; border: 1px solid #ddd;">${generatedPassword}</td>
                          </tr>
                      </table>
                      <p style="margin-top: 20px;">Please make sure to change your password after logging in for the first time.</p>
                      <p style="margin-top: 20px;">Best regards,<br>Carbon Crunch</p>
                  </body>
              </html>
          `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email} with username and password.`);

      // Return success message with the supplier company name
      res.status(201).json({
          status: "success",
          message: `${SupplierCompName} has been successfully added as a supplier.`,
          data: {
              supplier,
          },
      });
  } catch (error) {
      // Handle any database errors or unexpected issues
      console.error("Error creating supplier:", error);
      return next(new AppError("Error adding supplier. Please try again later.", 500));
  }
});

export const removeSupplier = expressAsyncHandler(async (req, res, next) => {
    console.log("Remove supplier endpoint hit");
    const {gstNo} = req.body;

    // 1. Ensure GST number is provided
    if (!gstNo) {
        return next(new AppError("GST number is required to remove a supplier", 400));
    }

    try {
        // 2. Find and delete the supplier using the GST number
        const supplier = await Supplier.findOneAndDelete({GSTNo: gstNo});

        // 3. If the supplier does not exist, return a 404 error
        if (!supplier) {
            return next(new AppError("Supplier not found", 404));
        }

        // Optionally, handle any related cleanup if needed (e.g., user data associated with the supplier)

        // 4. Return a success response
        res.status(200).json({
            status: "success",
            message: "Supplier removed successfully.",
        });
    } catch (error) {
        // 5. Handle errors during removal
        console.error("Error removing supplier:", error);
        return next(new AppError("Error removing supplier. Please try again later.", 500));
    }
});

export const viewSupplierDetails = expressAsyncHandler(async (req, res, next) => {
  const {supplierId} = req.params;

  try {
      const supplier = await Supplier.findById(supplierId).select("-username -password");

      if (!supplier) {
          return next(new AppError("Supplier not found", 404));
      }

      res.status(200).json({
          status: "success",
          data: {supplier},
      });
  } catch (error) {
      console.error("Error fetching supplier details:", error);
      return next(new AppError("Error fetching supplier details", 500));
  }
});

  // export const viewSupplierDetails = expressAsyncHandler(async (req, res, next) => {
  //   const { supplierId } = req.params;
  
  //   try {
  //     const supplier = await Supplier.findById(supplierId).select("-username -password");
  
  //     if (!supplier) {
  //       return next(new AppError("Supplier not found", 404));
  //     }
  
  //     res.status(200).json({
  //       status: "success",
  //       data: { supplier },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching supplier details:", error);
  //     return next(new AppError("Error fetching supplier details", 500));
  //   }
  // });
  
  
  
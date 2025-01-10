import mongoose from "mongoose";

const ESGReportSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  companyName: {
    type: String,
    required: true,
  },
  companyID: {},
  supplierID: {},
  report: [
    {
      reportId: {
        type: String,
      },
      reportName: {
        type: String,
      },
      report: {
        type: Object,
        default: {}, // Default to an empty object
      },
    },
  ],
  timePeriod: {
    type: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "custom"],
      required: true,
    },
    start: {
      type: Date,
    },
    end: {
      type: Date,
    },
  },
});

export const ESGReport = mongoose.model("ESGReport", ESGReportSchema);

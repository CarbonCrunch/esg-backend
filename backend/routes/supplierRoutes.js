import express from "express";
import { addSupplierQuestion, updateSupplierInfo, upload, getSupplierESGScores, updateSupplierESGScore} from "../controllers/supplierController.js";
import {
    addSupplierToCompany,
    getSuppliersForCompany, removeSupplier,
    viewSupplierDetails
} from "../controllers/companyController.js";

const router = express.Router();


router.post("/updateSupplierInfo", updateSupplierInfo);
router.post("/addSupplierQuestion", addSupplierQuestion);
router.post("/upload", upload);

// Update ESG score route to use username
router.get('/esgscores', getSupplierESGScores);
router.post('/:username/esgscore', updateSupplierESGScore);

// router.put('/:id/recalculate-esg', recalculateESGScore);

router.get('/suppliers', getSuppliersForCompany);
router.post('/addSupplier', addSupplierToCompany);
router.delete('/remove-supplier', removeSupplier);



router.get("/viewSupplierDetails/:supplierId", viewSupplierDetails);

export default router;

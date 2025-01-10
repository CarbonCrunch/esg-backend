// Calculate individual category score
export const calculateCategoryScore = (questions) => {
  let totalQuestions = 0;
  let trueAnswers = 0;
  console.log("ques", questions);
  questions.forEach((questionObj) => {
    console.log("ques obj", questionObj);
    totalQuestions++;
    if (questionObj.answer === "true") {
      trueAnswers++;
      // console.log(trueAnswers, totalQuestions, "for loop");
    }
  });

  // console.log((trueAnswers / totalQuestions) * 100);

  return totalQuestions > 0 ? (trueAnswers / totalQuestions) * 100 : 0;
};

// Calculate individual subcategory score as a percentage of the overall score
export const calculateSubcategoryScore = (subcategory, overallScore) => {
  const subcategoryScore = calculateCategoryScore(subcategory);
  return overallScore > 0 ? (subcategoryScore / overallScore) * 100 : 0;
};

// Calculate the score and grade for each category
export const calculateCategoryScoresAndGrade = (supplier) => {
  const { environment = {}, social = {}, governance = {} } = supplier;

  const environmentalScore = calculateCategoryScore([
    ...(environment.environmentalManagement || []),
    ...(environment.climateChange || []),
    ...(environment.airPollution || []),
    ...(environment.hazardousMaterialManagement || []),
    ...(environment.naturalResourceManagement || []),
    ...(environment.wasteManagement || []),
    ...(environment.regulatoryCompliance || []),
    ...(environment.pollutionPrevention || []),
  ]);

  const socialScore = calculateCategoryScore([
    ...(social.workerHealthSafety || []),
    ...(social.humanRightsLabourPractices || []),
    ...(social.regulatoryComplianceSocial || []),
    ...(social.consumerSafetyProductSafety || []),
    ...(social.communityInvolvement || []),
  ]);

  const governanceScore = calculateCategoryScore([
    ...(governance.BoardStructureIndependenceAccountability || []),
    ...(governance.EthicsAndCodeofConduct || []),
    ...(governance.ESGManagementPracticesAndProcesses || []),
    ...(governance.supplyChainManagement || []),
    ...(governance.dataPrivacySecurityManagement || []),
  ]);

  const businessScore = (environmentalScore + socialScore + governanceScore) / 3;
  const industryScore = 75; // Hardcoded value
  const overallESGScore = (businessScore + industryScore + environmentalScore + socialScore + governanceScore) / 5;

  return {
    scores: {
      environment: {
        environmentalScore,
        environmentalManagement: calculateSubcategoryScore(environment.environmentalManagement, environmentalScore),
        climateChange: calculateSubcategoryScore(environment.climateChange, environmentalScore),
        naturalResourceManagement: calculateSubcategoryScore(environment.naturalResourceManagement, environmentalScore),
        wasteManagement: calculateSubcategoryScore(environment.wasteManagement, environmentalScore),
        regulatoryCompliance: calculateSubcategoryScore(environment.regulatoryCompliance, environmentalScore),
        pollutionPrevention: calculateSubcategoryScore(environment.pollutionPrevention, environmentalScore),
      },
      social: {
        socialScore,
        workerHealthSafety: calculateSubcategoryScore(social.workerHealthSafety, socialScore),
        humanRightsLabourPractices: calculateSubcategoryScore(social.humanRightsLabourPractices, socialScore),
        regulatoryComplianceSocial: calculateSubcategoryScore(social.regulatoryComplianceSocial, socialScore),
        communityInvolvement: calculateSubcategoryScore(social.communityInvolvement, socialScore),
      },
      governance: {
        governanceScore,
        supplyChainManagement: calculateSubcategoryScore(governance.supplyChainManagement, governanceScore),
        ESGManagementPracticesAndProcesses: calculateSubcategoryScore(governance.ESGManagementPracticesAndProcesses, governanceScore),
        EthicsAndCodeofConduct: calculateSubcategoryScore(governance.EthicsAndCodeofConduct, governanceScore),
        BoardStructureIndependenceAccountability: calculateSubcategoryScore(governance.BoardStructureIndependenceAccountability, governanceScore),
      },
      businessScore,
      industryScore,
      overallESGScore,
    },
  };
};

// Assign grade based on score
export const assignGrade = (score) => {
  if (score >= 90) {
    return "A";
  } else if (score >= 75) {
    return "B";
  } else if (score >= 60) {
    return "C";
  } else if (score >= 45) {
    return "D";
  } else {
    return "E";
  }
};

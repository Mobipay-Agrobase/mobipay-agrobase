enum QuestionSectionType {
  training,
  prePlating,
  landPreparation,
  waterManagement,
  waterIrrigation,
  nutrientManagement,
  fertilizerApplication,
  integratedPestManagement,
  pesticideApplication,
  harvest,
  healthSafety,
  labourRights,
  womenEmpowerment,
  fieldVisit,
}

extension ExtQuestionSectionType on QuestionSectionType {
  String get title {
    switch (this) {
      case QuestionSectionType.training:
        return 'Training';
      case QuestionSectionType.prePlating:
        return 'Pre Planting';
      case QuestionSectionType.landPreparation:
        return 'Land Preparation';
      case QuestionSectionType.waterManagement:
        return 'Water Management';
      case QuestionSectionType.waterIrrigation:
        return 'Water Irrigation';
      case QuestionSectionType.nutrientManagement:
        return 'Nutrient Management';
      case QuestionSectionType.fertilizerApplication:
        return 'Fertilizer Application';
      case QuestionSectionType.integratedPestManagement:
        return 'Integrated Pest Management';
      case QuestionSectionType.pesticideApplication:
        return 'Pesticide Application';
      case QuestionSectionType.harvest:
        return 'Harvest';
      case QuestionSectionType.healthSafety:
        return 'Health And Safety';
      case QuestionSectionType.labourRights:
        return 'Labour Right';
      case QuestionSectionType.womenEmpowerment:
        return 'Women Empowerment';
      case QuestionSectionType.fieldVisit:
        return 'Field Visit';
    }
  }
}

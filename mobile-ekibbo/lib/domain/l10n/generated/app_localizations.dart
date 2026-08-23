// GENERATED-CODE - DO NOT MODIFY BY HAND
//
// Hand-generated to match Flutter gen_l10n output while the sandbox lacks a
// Flutter SDK. Running `flutter gen-l10n` locally regenerates equivalent
// files (same class names, delegates and getters).

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

/// Application translations.
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  /// A list of this localizations delegate along with the default delegates
  /// of `flutter_localization` (Material/Widgets/Cupertino global strings).
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi')
  ];

  String get basicInformation;
  String get farmerRegistration;
  String get enrollmentDate;
  String get enrollmentPlace;
  String get farmerCode;
  String get cooperative;
  String get farmerInformation;
  String get fullName;
  String get phoneNumber;
  String get identityProof;
  String get nationId;
  String get idNumber;
  String get idBack;
  String get dateOfBirth;
  String get idFront;
  String get contactInformation;
  String get country;
  String get province;
  String get district;
  String get commune;
  String get village;
  String get street;
  String get submit;
  String get dashboard;
  String get totalFarmers;
  String get totalHectares;
  String get estYieldQuantity;
  String get nearbyPlots;
  String get allTasks;
  String get qrScan;
  String get todayTasks;
  String get viewAllTasks;
  String get farmers;
  String get viewAllFarmers;
  String get addFarmer;
  String get addPlot;
  String get addCrop;
  String get cropSale;
  String get cropHarvest;
  String get activityHistory;
  String get profile;
  String get appLanguage;
  String get settings;
  String get version;
  String get signOut;
  String get overview;
  String get about;
  String get family;
  String get asset;
  String get bank;
  String get basicInfo;
  String get familyInfo;
  String get assetInfo;
  String get financeInfo;
  String get insuranceInfo;
  String get farmEquipment;
  String get animalHusbandry;
  String get certificateInfo;
  String get bankInfo;
  String get editFarmerProfile;
  String get call;
  String get signIn;
  String get selectRole;
  String get password;
  String get forgotPassword;
  String get fieldOfficer;
  String get pleaseFillPhone;
  String get pleaseFillName;
  String get pleaseFillPassword;
  String get userOrPassWrong;
  String get gender;
  String get male;
  String get female;
  String get pleaseChooseAvt;
  String get pleaseChooseFront;
  String get pleaseChooseBack;
  String get pleaseChoosePhoto;
  String get pleasePinLocation;
  String get pleaseChooseWarehouse;
  String get createFarmerSuccessfully;
  String get farmer;
  String get fieldName;
  String get totalLandHolding;
  String get plotFarmLocation;
  String get farmLandPlotting;
  String get totalPlotArea;
  String get plotsPhotos;
  String get landOwnership;
  String get save;
  String get approachRoad;
  String get landTopology;
  String get landGradient;
  String get landDocument;
  String get choosePhoto;
  String get pleaseFillFieldName;
  String get pleaseFillTotalLand;
  String get pleaseFillLandPlotting;
  String get options;
  String get camera;
  String get gallery;
  String get latitude;
  String get longtitude;
  String get harvestSeason;
  String get cropVariety;
  String get sowingDate;
  String get expectedDateHarvest;
  String get estYield;
  String get cropPhotos;
  String get pleaseChooseFarmer;
  String get pleaseChooseFarmland;
  String get pleaseChooseHarvestSeason;
  String get pleaseChooseCropCultivated;
  String get pleaseChooseCropVariety;
  String get pleaseChooseSowingDate;
  String get pleaseChooseExpectedDateHarvest;
  String get pleaseFillEstYield;
  String get cropCultivated;
  String get cropCreatedSuccessfully;
  String get cropUpdateSuccessfully;
  String get noDataAvailable;
  String get farmerSaveLocalSuccessfully;
  String get edit;
  String get sync;
  String get delete;
  String get askDeleteFarmer;
  String get askSyncAll;
  String get processTakeTime;
  String get farmerDetail;
  String get plots;
  String get viewPlots;
  String get location;
  String get allPlots;
  String get plotName;
  String get totalCrops;
  String get allFarmer;
  String get plot;
  String get syncData;
  String get education;
  String get marriageStatus;
  String get guardianParentName;
  String get spouseName;
  String get noOfFamilyMembers;
  String get noOfBoyChildren;
  String get noOfGirlChildren;
  String get noOfChildrenGoingSchool;
  String get updateFarmerSuccessfully;
  String get loanTakenLastYear;
  String get loanTakenFrom;
  String get loanAmount;
  String get purpose;
  String get loanInterest;
  String get interstPeriod;
  String get security;
  String get loanRepaymentAmount;
  String get loanRepaymentDate;
  String get updateFinanceSuccessfully;
  String get updateBankSuccessfully;
  String get monthly;
  String get yearly;
  String get remove;
  String get newBankInfo;
  String get farmAnimal;
  String get animalCount;
  String get fodder;
  String get animalHousing;
  String get revenue;
  String get breedName;
  String get animalForGrowth;
  String get addNewEquipment;
  String get addNew;
  String get addNewAnimalHusbandry;
  String get updateEquipmentSuccessfully;
  String get updateAnimalSuccessfully;
  String get updateInsuranceSuccessfully;
  String get lifeInsurance;
  String get healthInsurance;
  String get cropInsurance;
  String get socialInsurance;
  String get otherInsurance;
  String get welcomeBack;
  String get certifiedFarmer;
  String get certificationType;
  String get year;
  String get invidual;
  String get group;
  String get updateCertSuccessfully;
  String get housingOwnership;
  String get houseType;
  String get consumerElectronics;
  String get vehicle;
  String get accountType;
  String get accountNumber;
  String get bankName;
  String get branch;
  String get sortCode;
  String get insuranceAmount;
  String get endDate;
  String get searchFarmer;
  String get detail;
  String get crops;
  String get farmEquipmentItemCount;
  String get yearOfManufature;
  String get yearOfPurchase;
  String get newEquipment;
  String get updateAssetInformationSuccessfully;
  String get updateFamilyInfoSuccess;
  String get addNewInsurance;
  String get provider;
  String get cropInsured;
  String get noOfAreaInsured;
  String get pin;
  String get start;
  String get pause;
  String get reset;
  String get transactionCalendar;
  String get transaction;
  String get numberOfPlots;
  String get numberOfTrips;
  String get totalTransitQuantity;
  String get paymentReceived;
  String get totalReceivedQuantity;
  String get totalTransferedQuantity;
  String get bookingId;
  String get lotId;
  String get procurementId;
  String get warehouse;
  String get receptionDate;
  String get procurementDate;
  String get vehicleType;
  String get farmerNotBelongToYou;
  String get saleIntentions;
  String get generalInformation;
  String get inputDistribution;
  String get productInformation;
  String get addedDistribution;
  String get addProduct;
  String get distributionDetail;
  String get priviousDistributionQuantity;
  String get availableStock;
  String get category;
  String get product;
  String get outOfStock;
  String get pleaseFillStockDistribution;
  String get quantityMustBeGreaterThan0;
  String get quantityMustBeLessThan;
  String get quantityMustBeWholeNumber;
  String get distributionId;
  String get distributionStocks;
  String get totalCost;
  String get unit;
  String get type;
  String get date;
  String get rate;
  String get quantity;
  String get item;
  String get newCost;
  String get costInformation;
  String get cropHarvestInformation;
  String get cropInformation;
  String get variety;
  String get cultivatedArea;
  String get expectedHarvestDate;
  String get estimatedHarvestQty;
  String get subTotal;
  String get pricePerUnit;
  String get approxHarvestQty;
  String get actualQty;
  String get pinLocation;
  String get farmLand;
  String get harvestId;
  String get farmerPayment;
  String get crop;
  String get procurement;
  String get transactionDate;
  String get vehicleLicenseNumber;
  String get vehicleCapacity;
  String get driverName;
  String get driverPhoneNumber;
  String get cropHarvestIds;
  String get dateForFixHarvest;
  String get saleQuantity;
  String get availableDate;
  String get priceFrom;
  String get priceTo;
  String get productPhoto;
  String get addSaleIntention;
  String get grade;
  String get ageOfCrop;
  String get addQc;
  String get preHarvestQualityCheck;
  String get veryPoor;
  String get poor;
  String get average;
  String get good;
  String get excellent;
  String get permissionRequired;
  String get permissionContent;
  String get goToSettings;
  String get add;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {{
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {{
    final String langName = intl.Intl.canonicalizedLocale(locale.toString());
    for (final Locale l in AppLocalizations.supportedLocales) {{
      if (l.languageCode == langName) {{
        return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(langName));
      }}
    }}
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations('en'));
  }}

  @override
  bool isSupported(Locale locale) => <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}}

AppLocalizations lookupAppLocalizations(String langName) {{
  // Lookup logic here only works for the three supported locales.
  switch (langName) {{
    case 'en':
      return AppLocalizationsEn('en');
    case 'vi':
      return AppLocalizationsVi('vi');
    default:
      throw ArgumentError.value(langName, 'langName', 'Unsupported locale');
  }}
}}

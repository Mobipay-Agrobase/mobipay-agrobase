import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';

// Vietnamese localization (app_localizations_vi.dart) was removed on
// 2026-09-19 per user request — EKiBBO is a Uganda-only deployment and
// doesn't need Vietnamese. To re-enable, regenerate via `flutter gen-l10n`
// with a vi.arb file in lib/domain/l10n/.

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
  ];

  /// No description provided for @basic_information.
  ///
  /// In en, this message translates to:
  /// **'BASIC INFORMATION'**
  String get basic_information;

  /// No description provided for @farmer_registration.
  ///
  /// In en, this message translates to:
  /// **'Farmer Registration'**
  String get farmer_registration;

  /// No description provided for @enrollment_date.
  ///
  /// In en, this message translates to:
  /// **'Enrollment Date'**
  String get enrollment_date;

  /// No description provided for @enrollment_place.
  ///
  /// In en, this message translates to:
  /// **'Enrollment Place'**
  String get enrollment_place;

  /// No description provided for @farmer_code.
  ///
  /// In en, this message translates to:
  /// **'Farmer Code'**
  String get farmer_code;

  /// No description provided for @cooperative.
  ///
  /// In en, this message translates to:
  /// **'Cooperative'**
  String get cooperative;

  /// No description provided for @farmer_information.
  ///
  /// In en, this message translates to:
  /// **'FARMER INFORMATION'**
  String get farmer_information;

  /// No description provided for @full_name.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get full_name;

  /// No description provided for @phone_number.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phone_number;

  /// No description provided for @identity_proof.
  ///
  /// In en, this message translates to:
  /// **'Identity Proof'**
  String get identity_proof;

  /// No description provided for @nation_id.
  ///
  /// In en, this message translates to:
  /// **'National ID'**
  String get nation_id;

  /// No description provided for @id_number.
  ///
  /// In en, this message translates to:
  /// **'ID Number'**
  String get id_number;

  /// No description provided for @id_back.
  ///
  /// In en, this message translates to:
  /// **'ID Back'**
  String get id_back;

  /// No description provided for @date_of_birth.
  ///
  /// In en, this message translates to:
  /// **'Date of Birth'**
  String get date_of_birth;

  /// No description provided for @id_front.
  ///
  /// In en, this message translates to:
  /// **'ID Front'**
  String get id_front;

  /// No description provided for @contact_information.
  ///
  /// In en, this message translates to:
  /// **'CONTACT INFORMATION'**
  String get contact_information;

  /// No description provided for @country.
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get country;

  /// No description provided for @province.
  ///
  /// In en, this message translates to:
  /// **'Province'**
  String get province;

  /// No description provided for @district.
  ///
  /// In en, this message translates to:
  /// **'District'**
  String get district;

  /// No description provided for @commune.
  ///
  /// In en, this message translates to:
  /// **'Commune'**
  String get commune;

  /// No description provided for @village.
  ///
  /// In en, this message translates to:
  /// **'Village'**
  String get village;

  /// No description provided for @street.
  ///
  /// In en, this message translates to:
  /// **'Street'**
  String get street;

  /// No description provided for @submit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @total_farmers.
  ///
  /// In en, this message translates to:
  /// **'Total Farmers'**
  String get total_farmers;

  /// No description provided for @total_hectares.
  ///
  /// In en, this message translates to:
  /// **'Total Hectares'**
  String get total_hectares;

  /// No description provided for @est_yield_quantity.
  ///
  /// In en, this message translates to:
  /// **'Est Yield Quantity'**
  String get est_yield_quantity;

  /// No description provided for @nearby_plots.
  ///
  /// In en, this message translates to:
  /// **'Nearby Plots'**
  String get nearby_plots;

  /// No description provided for @all_tasks.
  ///
  /// In en, this message translates to:
  /// **'All tasks'**
  String get all_tasks;

  /// No description provided for @qr_scan.
  ///
  /// In en, this message translates to:
  /// **'QR Scan'**
  String get qr_scan;

  /// No description provided for @today_tasks.
  ///
  /// In en, this message translates to:
  /// **'Today Tasks'**
  String get today_tasks;

  /// No description provided for @view_all_tasks.
  ///
  /// In en, this message translates to:
  /// **'View All Tasks'**
  String get view_all_tasks;

  /// No description provided for @farmers.
  ///
  /// In en, this message translates to:
  /// **'Farmers'**
  String get farmers;

  /// No description provided for @view_all_farmers.
  ///
  /// In en, this message translates to:
  /// **'View All Farmers'**
  String get view_all_farmers;

  /// No description provided for @add_farmer.
  ///
  /// In en, this message translates to:
  /// **'Add Farmer'**
  String get add_farmer;

  /// No description provided for @add_plot.
  ///
  /// In en, this message translates to:
  /// **'Add Plot'**
  String get add_plot;

  /// No description provided for @add_crop.
  ///
  /// In en, this message translates to:
  /// **'Add Crop'**
  String get add_crop;

  /// No description provided for @crop_sale.
  ///
  /// In en, this message translates to:
  /// **'Crop Sale'**
  String get crop_sale;

  /// No description provided for @crop_harvest.
  ///
  /// In en, this message translates to:
  /// **'Crop Harvest'**
  String get crop_harvest;

  /// No description provided for @activity_history.
  ///
  /// In en, this message translates to:
  /// **'Activity History'**
  String get activity_history;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @app_language.
  ///
  /// In en, this message translates to:
  /// **'App Language'**
  String get app_language;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @version.
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get version;

  /// No description provided for @sign_out.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get sign_out;

  /// No description provided for @overview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get overview;

  /// No description provided for @about.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// No description provided for @family.
  ///
  /// In en, this message translates to:
  /// **'Family'**
  String get family;

  /// No description provided for @asset.
  ///
  /// In en, this message translates to:
  /// **'Asset'**
  String get asset;

  /// No description provided for @bank.
  ///
  /// In en, this message translates to:
  /// **'Bank'**
  String get bank;

  /// No description provided for @basic_info.
  ///
  /// In en, this message translates to:
  /// **'Basic Information'**
  String get basic_info;

  /// No description provided for @family_info.
  ///
  /// In en, this message translates to:
  /// **'Family Information'**
  String get family_info;

  /// No description provided for @asset_info.
  ///
  /// In en, this message translates to:
  /// **'Asset Information'**
  String get asset_info;

  /// No description provided for @finance_info.
  ///
  /// In en, this message translates to:
  /// **'Finance Information'**
  String get finance_info;

  /// No description provided for @insurance_info.
  ///
  /// In en, this message translates to:
  /// **'Insurance Information'**
  String get insurance_info;

  /// No description provided for @farm_equipment.
  ///
  /// In en, this message translates to:
  /// **'Farm Equipment'**
  String get farm_equipment;

  /// No description provided for @animal_husbandry.
  ///
  /// In en, this message translates to:
  /// **'Animal Husbandry'**
  String get animal_husbandry;

  /// No description provided for @certificate_info.
  ///
  /// In en, this message translates to:
  /// **'Certificate Information'**
  String get certificate_info;

  /// No description provided for @bank_info.
  ///
  /// In en, this message translates to:
  /// **'Bank Information'**
  String get bank_info;

  /// No description provided for @edit_farmer_profile.
  ///
  /// In en, this message translates to:
  /// **'Edit Farmer Profile'**
  String get edit_farmer_profile;

  /// No description provided for @call.
  ///
  /// In en, this message translates to:
  /// **'Call'**
  String get call;

  /// No description provided for @sign_in.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get sign_in;

  /// No description provided for @select_role.
  ///
  /// In en, this message translates to:
  /// **'Select Role'**
  String get select_role;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @forgot_password.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password ?'**
  String get forgot_password;

  /// No description provided for @field_officer.
  ///
  /// In en, this message translates to:
  /// **'Field Officer'**
  String get field_officer;

  /// No description provided for @please_fill_phone.
  ///
  /// In en, this message translates to:
  /// **'Please fill phone number!'**
  String get please_fill_phone;

  /// No description provided for @please_fill_name.
  ///
  /// In en, this message translates to:
  /// **'Please fill full name!'**
  String get please_fill_name;

  /// No description provided for @please_fill_password.
  ///
  /// In en, this message translates to:
  /// **'Please fill password!'**
  String get please_fill_password;

  /// No description provided for @user_or_pass_wrong.
  ///
  /// In en, this message translates to:
  /// **'Login information is incorrect, please check again!'**
  String get user_or_pass_wrong;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @male.
  ///
  /// In en, this message translates to:
  /// **'Male'**
  String get male;

  /// No description provided for @female.
  ///
  /// In en, this message translates to:
  /// **'Female'**
  String get female;

  /// No description provided for @please_choose_avt.
  ///
  /// In en, this message translates to:
  /// **'Please upload farmer\'s photo!'**
  String get please_choose_avt;

  /// No description provided for @please_choose_front.
  ///
  /// In en, this message translates to:
  /// **'Please upload front proof photo!'**
  String get please_choose_front;

  /// No description provided for @please_choose_back.
  ///
  /// In en, this message translates to:
  /// **'Please upload back proof photo!'**
  String get please_choose_back;

  /// No description provided for @please_choose_photo.
  ///
  /// In en, this message translates to:
  /// **'please choose photo'**
  String get please_choose_photo;

  /// No description provided for @please_pin_location.
  ///
  /// In en, this message translates to:
  /// **'please pin location'**
  String get please_pin_location;

  /// No description provided for @please_choose_warehouse.
  ///
  /// In en, this message translates to:
  /// **'please choose warehouse'**
  String get please_choose_warehouse;

  /// No description provided for @create_farmer_successfully.
  ///
  /// In en, this message translates to:
  /// **'Create farmer successfully!'**
  String get create_farmer_successfully;

  /// No description provided for @farmer.
  ///
  /// In en, this message translates to:
  /// **'Farmer'**
  String get farmer;

  /// No description provided for @field_name.
  ///
  /// In en, this message translates to:
  /// **'Field/Plot/Farm Name'**
  String get field_name;

  /// No description provided for @total_land_holding.
  ///
  /// In en, this message translates to:
  /// **'Total Land Holding'**
  String get total_land_holding;

  /// No description provided for @plot_farm_location.
  ///
  /// In en, this message translates to:
  /// **'Plot/Farm Location'**
  String get plot_farm_location;

  /// No description provided for @farm_land_plotting.
  ///
  /// In en, this message translates to:
  /// **'Farm Land Plotting'**
  String get farm_land_plotting;

  /// No description provided for @total_plot_area.
  ///
  /// In en, this message translates to:
  /// **'Total Plot Area'**
  String get total_plot_area;

  /// No description provided for @plots_photos.
  ///
  /// In en, this message translates to:
  /// **'Plot Photos'**
  String get plots_photos;

  /// No description provided for @land_ownership.
  ///
  /// In en, this message translates to:
  /// **'Land Ownership'**
  String get land_ownership;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @approach_road.
  ///
  /// In en, this message translates to:
  /// **'Approach Road'**
  String get approach_road;

  /// No description provided for @land_topology.
  ///
  /// In en, this message translates to:
  /// **'Land Topology'**
  String get land_topology;

  /// No description provided for @land_gradient.
  ///
  /// In en, this message translates to:
  /// **'Land Gradient'**
  String get land_gradient;

  /// No description provided for @land_document.
  ///
  /// In en, this message translates to:
  /// **'Land Document'**
  String get land_document;

  /// No description provided for @choose_photo.
  ///
  /// In en, this message translates to:
  /// **'Choose photo'**
  String get choose_photo;

  /// No description provided for @please_fill_field_name.
  ///
  /// In en, this message translates to:
  /// **'Plase fill plot name!'**
  String get please_fill_field_name;

  /// No description provided for @please_fill_total_land.
  ///
  /// In en, this message translates to:
  /// **'Plase fill total land holding!'**
  String get please_fill_total_land;

  /// No description provided for @please_fill_land_plotting.
  ///
  /// In en, this message translates to:
  /// **'Plase fill farm land plotting!'**
  String get please_fill_land_plotting;

  /// No description provided for @options.
  ///
  /// In en, this message translates to:
  /// **'Options'**
  String get options;

  /// No description provided for @camera.
  ///
  /// In en, this message translates to:
  /// **'Camera'**
  String get camera;

  /// No description provided for @gallery.
  ///
  /// In en, this message translates to:
  /// **'Gallery'**
  String get gallery;

  /// No description provided for @latitude.
  ///
  /// In en, this message translates to:
  /// **'Latitude'**
  String get latitude;

  /// No description provided for @longtitude.
  ///
  /// In en, this message translates to:
  /// **'Longtitude'**
  String get longtitude;

  /// No description provided for @harvest_season.
  ///
  /// In en, this message translates to:
  /// **'Harvest Season'**
  String get harvest_season;

  /// No description provided for @crop_variety.
  ///
  /// In en, this message translates to:
  /// **'Crop Variety'**
  String get crop_variety;

  /// No description provided for @sowing_date.
  ///
  /// In en, this message translates to:
  /// **'Sowing Date'**
  String get sowing_date;

  /// No description provided for @expected_date_harvest.
  ///
  /// In en, this message translates to:
  /// **'Expected Date of Harvest'**
  String get expected_date_harvest;

  /// No description provided for @est_yield.
  ///
  /// In en, this message translates to:
  /// **'Est Yield'**
  String get est_yield;

  /// No description provided for @crop_photos.
  ///
  /// In en, this message translates to:
  /// **'Crop Photos'**
  String get crop_photos;

  /// No description provided for @please_choose_farmer.
  ///
  /// In en, this message translates to:
  /// **'Please choose farmer!'**
  String get please_choose_farmer;

  /// No description provided for @please_choose_farmland.
  ///
  /// In en, this message translates to:
  /// **'Please choose farm land!'**
  String get please_choose_farmland;

  /// No description provided for @please_choose_harvest_season.
  ///
  /// In en, this message translates to:
  /// **'Please choose harvest season!'**
  String get please_choose_harvest_season;

  /// No description provided for @please_choose_crop_cultivated.
  ///
  /// In en, this message translates to:
  /// **'Please choose crop cultivated!'**
  String get please_choose_crop_cultivated;

  /// No description provided for @please_choose_crop_variety.
  ///
  /// In en, this message translates to:
  /// **'Please choose crop variety!'**
  String get please_choose_crop_variety;

  /// No description provided for @please_choose_sowing_date.
  ///
  /// In en, this message translates to:
  /// **'Please choose sowing date!'**
  String get please_choose_sowing_date;

  /// No description provided for @please_choose_expected_date_harvest.
  ///
  /// In en, this message translates to:
  /// **'Please choose expected date of harvest after sowing!'**
  String get please_choose_expected_date_harvest;

  /// No description provided for @please_fill_est_yield.
  ///
  /// In en, this message translates to:
  /// **'Please fill est yield!'**
  String get please_fill_est_yield;

  /// No description provided for @crop_cultivated.
  ///
  /// In en, this message translates to:
  /// **'Crop Cultivated'**
  String get crop_cultivated;

  /// No description provided for @crop_created_successfully.
  ///
  /// In en, this message translates to:
  /// **'Crops Created Successfully'**
  String get crop_created_successfully;

  /// No description provided for @crop_update_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update Crops Successfully'**
  String get crop_update_successfully;

  /// No description provided for @no_data_available.
  ///
  /// In en, this message translates to:
  /// **'No data available'**
  String get no_data_available;

  /// No description provided for @farmer_save_local_successfully.
  ///
  /// In en, this message translates to:
  /// **'There is a network problem, the farmer has been saved to local data!'**
  String get farmer_save_local_successfully;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @sync.
  ///
  /// In en, this message translates to:
  /// **'Sync'**
  String get sync;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @ask_delete_farmer.
  ///
  /// In en, this message translates to:
  /// **'Do you want to delete this farmer?'**
  String get ask_delete_farmer;

  /// No description provided for @ask_sync_all.
  ///
  /// In en, this message translates to:
  /// **'Do you want to sync all farmer?'**
  String get ask_sync_all;

  /// No description provided for @process_take_time.
  ///
  /// In en, this message translates to:
  /// **'This process could take a few minutes.'**
  String get process_take_time;

  /// No description provided for @farmer_detail.
  ///
  /// In en, this message translates to:
  /// **'Farmer Detail'**
  String get farmer_detail;

  /// No description provided for @plots.
  ///
  /// In en, this message translates to:
  /// **'plots'**
  String get plots;

  /// No description provided for @view_plots.
  ///
  /// In en, this message translates to:
  /// **'View Plots'**
  String get view_plots;

  /// No description provided for @location.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// No description provided for @all_plots.
  ///
  /// In en, this message translates to:
  /// **'All Plots'**
  String get all_plots;

  /// No description provided for @plot_name.
  ///
  /// In en, this message translates to:
  /// **'Plot Name'**
  String get plot_name;

  /// No description provided for @total_crops.
  ///
  /// In en, this message translates to:
  /// **'Total Crops'**
  String get total_crops;

  /// No description provided for @all_farmer.
  ///
  /// In en, this message translates to:
  /// **'All Farmers'**
  String get all_farmer;

  /// No description provided for @plot.
  ///
  /// In en, this message translates to:
  /// **'Plot'**
  String get plot;

  /// No description provided for @sync_data.
  ///
  /// In en, this message translates to:
  /// **'Sync Data'**
  String get sync_data;

  /// No description provided for @education.
  ///
  /// In en, this message translates to:
  /// **'Education'**
  String get education;

  /// No description provided for @marriage_status.
  ///
  /// In en, this message translates to:
  /// **'Marriage Status'**
  String get marriage_status;

  /// No description provided for @guardian_parent_name.
  ///
  /// In en, this message translates to:
  /// **'Guardian/Parent Name'**
  String get guardian_parent_name;

  /// No description provided for @spouse_name.
  ///
  /// In en, this message translates to:
  /// **'Spouse Name'**
  String get spouse_name;

  /// No description provided for @no_of_family_members.
  ///
  /// In en, this message translates to:
  /// **'No. of Family Members'**
  String get no_of_family_members;

  /// No description provided for @no_of_boy_children.
  ///
  /// In en, this message translates to:
  /// **'No. of Boy children (under 18YO)'**
  String get no_of_boy_children;

  /// No description provided for @no_of_girl_children.
  ///
  /// In en, this message translates to:
  /// **'No. of Girl children (under 18YO)'**
  String get no_of_girl_children;

  /// No description provided for @no_of_children_going_school.
  ///
  /// In en, this message translates to:
  /// **'No. of Children who going to school'**
  String get no_of_children_going_school;

  /// No description provided for @update_farmer_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update farmer successfully!'**
  String get update_farmer_successfully;

  /// No description provided for @loan_taken_last_year.
  ///
  /// In en, this message translates to:
  /// **'Loan taken Last Year'**
  String get loan_taken_last_year;

  /// No description provided for @loan_taken_from.
  ///
  /// In en, this message translates to:
  /// **'Loan Taken From'**
  String get loan_taken_from;

  /// No description provided for @loan_amount.
  ///
  /// In en, this message translates to:
  /// **'Loan Amount'**
  String get loan_amount;

  /// No description provided for @purpose.
  ///
  /// In en, this message translates to:
  /// **'Purpose'**
  String get purpose;

  /// No description provided for @loan_interest.
  ///
  /// In en, this message translates to:
  /// **'Loan Interest(%)'**
  String get loan_interest;

  /// No description provided for @interst_period.
  ///
  /// In en, this message translates to:
  /// **'Interest Period'**
  String get interst_period;

  /// No description provided for @security.
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get security;

  /// No description provided for @loan_repayment_amount.
  ///
  /// In en, this message translates to:
  /// **'Loan Repayment Amount'**
  String get loan_repayment_amount;

  /// No description provided for @loan_repayment_date.
  ///
  /// In en, this message translates to:
  /// **'Loan Repayment Date'**
  String get loan_repayment_date;

  /// No description provided for @update_finance_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update finance info successfully!'**
  String get update_finance_successfully;

  /// No description provided for @update_bank_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update bank info successfully!'**
  String get update_bank_successfully;

  /// No description provided for @monthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly'**
  String get monthly;

  /// No description provided for @yearly.
  ///
  /// In en, this message translates to:
  /// **'Yearly'**
  String get yearly;

  /// No description provided for @remove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get remove;

  /// No description provided for @new_bank_info.
  ///
  /// In en, this message translates to:
  /// **'New bank Info'**
  String get new_bank_info;

  /// No description provided for @farm_animal.
  ///
  /// In en, this message translates to:
  /// **'Farm Animal'**
  String get farm_animal;

  /// No description provided for @animal_count.
  ///
  /// In en, this message translates to:
  /// **'Animal Count'**
  String get animal_count;

  /// No description provided for @fodder.
  ///
  /// In en, this message translates to:
  /// **'Fodder'**
  String get fodder;

  /// No description provided for @animal_housing.
  ///
  /// In en, this message translates to:
  /// **'Animal Housing'**
  String get animal_housing;

  /// No description provided for @revenue.
  ///
  /// In en, this message translates to:
  /// **'Revenue'**
  String get revenue;

  /// No description provided for @breed_name.
  ///
  /// In en, this message translates to:
  /// **'Breed name'**
  String get breed_name;

  /// No description provided for @animal_for_growth.
  ///
  /// In en, this message translates to:
  /// **'Animal for Growth'**
  String get animal_for_growth;

  /// No description provided for @add_new_equipment.
  ///
  /// In en, this message translates to:
  /// **'Add New Equipment'**
  String get add_new_equipment;

  /// No description provided for @add_new_.
  ///
  /// In en, this message translates to:
  /// **'Add New Equipment'**
  String get add_new_;

  /// No description provided for @add_new_animal_husbandry.
  ///
  /// In en, this message translates to:
  /// **'Add New Animal Husbandry'**
  String get add_new_animal_husbandry;

  /// No description provided for @update_equipment_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update Farm equipment successfully!'**
  String get update_equipment_successfully;

  /// No description provided for @update_animal_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update animal husbandry successfully!'**
  String get update_animal_successfully;

  /// No description provided for @update_insurance_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update insurance successfully!'**
  String get update_insurance_successfully;

  /// No description provided for @life_insurance.
  ///
  /// In en, this message translates to:
  /// **'Life Insurance'**
  String get life_insurance;

  /// No description provided for @health_insurance.
  ///
  /// In en, this message translates to:
  /// **'Health Insurance'**
  String get health_insurance;

  /// No description provided for @crop_insurance.
  ///
  /// In en, this message translates to:
  /// **'Crop Insurance'**
  String get crop_insurance;

  /// No description provided for @social_insurance.
  ///
  /// In en, this message translates to:
  /// **'Social Insurance'**
  String get social_insurance;

  /// No description provided for @other_insurance.
  ///
  /// In en, this message translates to:
  /// **'Other Insurance'**
  String get other_insurance;

  /// No description provided for @welcome_back.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcome_back;

  /// No description provided for @certified_farmer.
  ///
  /// In en, this message translates to:
  /// **'Certified Farmer'**
  String get certified_farmer;

  /// No description provided for @certification_type.
  ///
  /// In en, this message translates to:
  /// **'Certification Type'**
  String get certification_type;

  /// No description provided for @year.
  ///
  /// In en, this message translates to:
  /// **'Year'**
  String get year;

  /// No description provided for @invidual.
  ///
  /// In en, this message translates to:
  /// **'Individual'**
  String get invidual;

  /// No description provided for @group.
  ///
  /// In en, this message translates to:
  /// **'Group'**
  String get group;

  /// No description provided for @update_cert_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update Certificate information successfully!'**
  String get update_cert_successfully;

  /// No description provided for @housing_ownership.
  ///
  /// In en, this message translates to:
  /// **'Housing Ownership'**
  String get housing_ownership;

  /// No description provided for @house_type.
  ///
  /// In en, this message translates to:
  /// **'House Type'**
  String get house_type;

  /// No description provided for @consumer_electronics.
  ///
  /// In en, this message translates to:
  /// **'Consumer Electronics'**
  String get consumer_electronics;

  /// No description provided for @vehicle.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get vehicle;

  /// No description provided for @account_type.
  ///
  /// In en, this message translates to:
  /// **'Account Type'**
  String get account_type;

  /// No description provided for @account_number.
  ///
  /// In en, this message translates to:
  /// **'Account Number'**
  String get account_number;

  /// No description provided for @bank_name.
  ///
  /// In en, this message translates to:
  /// **'Bank Name'**
  String get bank_name;

  /// No description provided for @branch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get branch;

  /// No description provided for @sort_code.
  ///
  /// In en, this message translates to:
  /// **'Sort Code'**
  String get sort_code;

  /// No description provided for @insurance_amount.
  ///
  /// In en, this message translates to:
  /// **'Insurance amount'**
  String get insurance_amount;

  /// No description provided for @end_date.
  ///
  /// In en, this message translates to:
  /// **'End date'**
  String get end_date;

  /// No description provided for @search_farmer.
  ///
  /// In en, this message translates to:
  /// **'Search farmer'**
  String get search_farmer;

  /// No description provided for @detail.
  ///
  /// In en, this message translates to:
  /// **'Detail'**
  String get detail;

  /// No description provided for @crops.
  ///
  /// In en, this message translates to:
  /// **'Crops'**
  String get crops;

  /// No description provided for @farm_equipment_item_count.
  ///
  /// In en, this message translates to:
  /// **'Item Count'**
  String get farm_equipment_item_count;

  /// No description provided for @year_of_manufature.
  ///
  /// In en, this message translates to:
  /// **'Year of Manufacture'**
  String get year_of_manufature;

  /// No description provided for @year_of_purchase.
  ///
  /// In en, this message translates to:
  /// **'Year of purchase'**
  String get year_of_purchase;

  /// No description provided for @new_equipment.
  ///
  /// In en, this message translates to:
  /// **'New Equipment'**
  String get new_equipment;

  /// No description provided for @update_asset_information_successfully.
  ///
  /// In en, this message translates to:
  /// **'Update Asset information successfully!'**
  String get update_asset_information_successfully;

  /// No description provided for @update_family_info_success.
  ///
  /// In en, this message translates to:
  /// **'Update Family information successfully!'**
  String get update_family_info_success;

  /// No description provided for @add_new_insurance.
  ///
  /// In en, this message translates to:
  /// **'Add new Insurance'**
  String get add_new_insurance;

  /// No description provided for @provider.
  ///
  /// In en, this message translates to:
  /// **'Provider'**
  String get provider;

  /// No description provided for @crop_insured.
  ///
  /// In en, this message translates to:
  /// **'Crop Insured'**
  String get crop_insured;

  /// No description provided for @no_of_area_insured.
  ///
  /// In en, this message translates to:
  /// **'No of area Insured'**
  String get no_of_area_insured;

  /// No description provided for @pin.
  ///
  /// In en, this message translates to:
  /// **'Pin'**
  String get pin;

  /// No description provided for @start.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get start;

  /// No description provided for @pause.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get pause;

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @transaction_calendar.
  ///
  /// In en, this message translates to:
  /// **'Transaction Calendar'**
  String get transaction_calendar;

  /// No description provided for @transaction.
  ///
  /// In en, this message translates to:
  /// **'Transaction'**
  String get transaction;

  /// No description provided for @number_of_plots.
  ///
  /// In en, this message translates to:
  /// **'Number Of Plots'**
  String get number_of_plots;

  /// No description provided for @number_of_trips.
  ///
  /// In en, this message translates to:
  /// **'Number Of Trips'**
  String get number_of_trips;

  /// No description provided for @total_transit_quantity.
  ///
  /// In en, this message translates to:
  /// **'Total Transit Quantity'**
  String get total_transit_quantity;

  /// No description provided for @payment_received.
  ///
  /// In en, this message translates to:
  /// **'Payment Received'**
  String get payment_received;

  /// No description provided for @total_received_quantity.
  ///
  /// In en, this message translates to:
  /// **'Total Received Quantity'**
  String get total_received_quantity;

  /// No description provided for @total_transfered_quantity.
  ///
  /// In en, this message translates to:
  /// **'Total Transfered Quantity'**
  String get total_transfered_quantity;

  /// No description provided for @booking_id.
  ///
  /// In en, this message translates to:
  /// **'Booking ID'**
  String get booking_id;

  /// No description provided for @lot_id.
  ///
  /// In en, this message translates to:
  /// **'Lot ID'**
  String get lot_id;

  /// No description provided for @procurement_id.
  ///
  /// In en, this message translates to:
  /// **'Procurement ID'**
  String get procurement_id;

  /// No description provided for @warehouse.
  ///
  /// In en, this message translates to:
  /// **'Warehouse'**
  String get warehouse;

  /// No description provided for @reception_date.
  ///
  /// In en, this message translates to:
  /// **'Reception Date'**
  String get reception_date;

  /// No description provided for @procurement_date.
  ///
  /// In en, this message translates to:
  /// **'Procurement Date'**
  String get procurement_date;

  /// No description provided for @vehicle_type.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Type'**
  String get vehicle_type;

  /// No description provided for @farmer_not_belong_to_you.
  ///
  /// In en, this message translates to:
  /// **'This farmer is not belongs to you!'**
  String get farmer_not_belong_to_you;

  /// No description provided for @sale_intentions.
  ///
  /// In en, this message translates to:
  /// **'Sale Intentions'**
  String get sale_intentions;

  /// No description provided for @general_information.
  ///
  /// In en, this message translates to:
  /// **'General Information'**
  String get general_information;

  /// No description provided for @input_distribution.
  ///
  /// In en, this message translates to:
  /// **'Input Distribution'**
  String get input_distribution;

  /// No description provided for @product_information.
  ///
  /// In en, this message translates to:
  /// **'Product Information'**
  String get product_information;

  /// No description provided for @added_distribution.
  ///
  /// In en, this message translates to:
  /// **'Successful allocation with invoice code'**
  String get added_distribution;

  /// No description provided for @add_product.
  ///
  /// In en, this message translates to:
  /// **'Add Product'**
  String get add_product;

  /// No description provided for @distribution_detail.
  ///
  /// In en, this message translates to:
  /// **'Distribution Detail'**
  String get distribution_detail;

  /// No description provided for @privious_distribution_quantity.
  ///
  /// In en, this message translates to:
  /// **'Previous Distribution Quantity'**
  String get privious_distribution_quantity;

  /// No description provided for @available_stock.
  ///
  /// In en, this message translates to:
  /// **'Available Stock'**
  String get available_stock;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @product.
  ///
  /// In en, this message translates to:
  /// **'Product'**
  String get product;

  /// No description provided for @out_of_stock.
  ///
  /// In en, this message translates to:
  /// **'Out of stock'**
  String get out_of_stock;

  /// No description provided for @please_fill_stock_distribution.
  ///
  /// In en, this message translates to:
  /// **'Please fill stock distribution'**
  String get please_fill_stock_distribution;

  /// No description provided for @quantity_must_be_greater_than_0.
  ///
  /// In en, this message translates to:
  /// **'Quantity must be greater than 0'**
  String get quantity_must_be_greater_than_0;

  /// No description provided for @quantity_must_be_less_than.
  ///
  /// In en, this message translates to:
  /// **'Quantity must be less than '**
  String get quantity_must_be_less_than;

  /// No description provided for @quantity_must_be_whole_number.
  ///
  /// In en, this message translates to:
  /// **'Must be whole number'**
  String get quantity_must_be_whole_number;

  /// No description provided for @distribution_id.
  ///
  /// In en, this message translates to:
  /// **'Distribution Id'**
  String get distribution_id;

  /// No description provided for @distribution_stocks.
  ///
  /// In en, this message translates to:
  /// **'Distribution Stocks'**
  String get distribution_stocks;

  /// No description provided for @total_cost.
  ///
  /// In en, this message translates to:
  /// **'Total Amount'**
  String get total_cost;

  /// No description provided for @unit.
  ///
  /// In en, this message translates to:
  /// **'Unit'**
  String get unit;

  /// No description provided for @type.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get type;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @rate.
  ///
  /// In en, this message translates to:
  /// **'Rate'**
  String get rate;

  /// No description provided for @quantity.
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get quantity;

  /// No description provided for @item.
  ///
  /// In en, this message translates to:
  /// **'Item'**
  String get item;

  /// No description provided for @new_cost.
  ///
  /// In en, this message translates to:
  /// **'New Cost'**
  String get new_cost;

  /// No description provided for @cost_information.
  ///
  /// In en, this message translates to:
  /// **'Cost Information'**
  String get cost_information;

  /// No description provided for @crop_harvest_information.
  ///
  /// In en, this message translates to:
  /// **'Crop Harvest Information'**
  String get crop_harvest_information;

  /// No description provided for @crop_information.
  ///
  /// In en, this message translates to:
  /// **'Crop Information'**
  String get crop_information;

  /// No description provided for @variety.
  ///
  /// In en, this message translates to:
  /// **'Variety'**
  String get variety;

  /// No description provided for @cultivated_area.
  ///
  /// In en, this message translates to:
  /// **'Cultivated Area'**
  String get cultivated_area;

  /// No description provided for @expected_harvest_date.
  ///
  /// In en, this message translates to:
  /// **'Expected Harvest Date'**
  String get expected_harvest_date;

  /// No description provided for @estimated_harvest_qty.
  ///
  /// In en, this message translates to:
  /// **'Estimated Harvest Qty'**
  String get estimated_harvest_qty;

  /// No description provided for @sub_total.
  ///
  /// In en, this message translates to:
  /// **'Sub Total'**
  String get sub_total;

  /// No description provided for @price_per_unit.
  ///
  /// In en, this message translates to:
  /// **'Price Per Unit'**
  String get price_per_unit;

  /// No description provided for @approx_harvest_qty.
  ///
  /// In en, this message translates to:
  /// **'Approx Harvest Qty'**
  String get approx_harvest_qty;

  /// No description provided for @actual_qty.
  ///
  /// In en, this message translates to:
  /// **'Actual Qty'**
  String get actual_qty;

  /// No description provided for @pin_location.
  ///
  /// In en, this message translates to:
  /// **'Pin Location'**
  String get pin_location;

  /// No description provided for @farm_land.
  ///
  /// In en, this message translates to:
  /// **'Farm Land'**
  String get farm_land;

  /// No description provided for @harvest_id.
  ///
  /// In en, this message translates to:
  /// **'Harvest ID'**
  String get harvest_id;

  /// No description provided for @farmer_payment.
  ///
  /// In en, this message translates to:
  /// **'Farmer Payment'**
  String get farmer_payment;

  /// No description provided for @crop.
  ///
  /// In en, this message translates to:
  /// **'Crop'**
  String get crop;

  /// No description provided for @procurement.
  ///
  /// In en, this message translates to:
  /// **'Procurement'**
  String get procurement;

  /// No description provided for @transaction_date.
  ///
  /// In en, this message translates to:
  /// **'Transaction Date'**
  String get transaction_date;

  /// No description provided for @vehicle_license_number.
  ///
  /// In en, this message translates to:
  /// **'Vehicle License Number'**
  String get vehicle_license_number;

  /// No description provided for @vehicle_capacity.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Capacity'**
  String get vehicle_capacity;

  /// No description provided for @driver_name.
  ///
  /// In en, this message translates to:
  /// **'Driver Name'**
  String get driver_name;

  /// No description provided for @driver_phone_number.
  ///
  /// In en, this message translates to:
  /// **'Driver Phone Number'**
  String get driver_phone_number;

  /// No description provided for @crop_harvest_ids.
  ///
  /// In en, this message translates to:
  /// **'Crop Harvest ID'**
  String get crop_harvest_ids;

  /// No description provided for @date_for_fix_harvest.
  ///
  /// In en, this message translates to:
  /// **'Date for fix harvest *'**
  String get date_for_fix_harvest;

  /// No description provided for @sale_quantity.
  ///
  /// In en, this message translates to:
  /// **'Sale Quantity *'**
  String get sale_quantity;

  /// No description provided for @available_date.
  ///
  /// In en, this message translates to:
  /// **'Available date *'**
  String get available_date;

  /// No description provided for @price_from.
  ///
  /// In en, this message translates to:
  /// **'Price (from)'**
  String get price_from;

  /// No description provided for @price_to.
  ///
  /// In en, this message translates to:
  /// **'Price (to)'**
  String get price_to;

  /// No description provided for @product_photo.
  ///
  /// In en, this message translates to:
  /// **'Product photo *'**
  String get product_photo;

  /// No description provided for @add_sale_intention.
  ///
  /// In en, this message translates to:
  /// **'Add Sale Intention'**
  String get add_sale_intention;

  /// No description provided for @grade.
  ///
  /// In en, this message translates to:
  /// **'Grade'**
  String get grade;

  /// No description provided for @age_of_crop.
  ///
  /// In en, this message translates to:
  /// **'Age of crop'**
  String get age_of_crop;

  /// No description provided for @add_qc.
  ///
  /// In en, this message translates to:
  /// **'Add QC'**
  String get add_qc;

  /// No description provided for @pre_harvest_quality_check.
  ///
  /// In en, this message translates to:
  /// **'Pre Harvest Quality Check'**
  String get pre_harvest_quality_check;

  /// No description provided for @very_poor.
  ///
  /// In en, this message translates to:
  /// **'Very poor'**
  String get very_poor;

  /// No description provided for @poor.
  ///
  /// In en, this message translates to:
  /// **'Poor'**
  String get poor;

  /// No description provided for @average.
  ///
  /// In en, this message translates to:
  /// **'Average'**
  String get average;

  /// No description provided for @good.
  ///
  /// In en, this message translates to:
  /// **'Good'**
  String get good;

  /// No description provided for @excellent.
  ///
  /// In en, this message translates to:
  /// **'Excellent'**
  String get excellent;

  /// No description provided for @permission_required.
  ///
  /// In en, this message translates to:
  /// **'Permission Required'**
  String get permission_required;

  /// No description provided for @permission_content.
  ///
  /// In en, this message translates to:
  /// **'To use this feature, you need to allow access to your location.\n\nPlease press \'Go To Settings\' and select \'Allow\' location permission.'**
  String get permission_content;

  /// No description provided for @go_to_settings.
  ///
  /// In en, this message translates to:
  /// **'Go To Settings'**
  String get go_to_settings;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get add;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}

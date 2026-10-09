export interface LoginModel {
  phone?: string;
  password?: string;
}

export interface LoginResponseModel {
  vendor_logged_in?: boolean;
  vender_user_id?: string;
  vendor_user_id?: string;
  name?: string;
  vendor_id?: string;
  vendor_phone_no?: string;
  profile_picture?: string;
  user_status?: string;
  login_status?: string;
}

export interface CitizenLoginModel {
  phone: string;
  password: string;
}

export interface CitizenProfileModel {
  citizen_id?: string;
  name?: string;
  mobile_no?: string;
  gender?: string;
  email?: string;
  address?: any;
  otp?: string;
  status?: string;
  created_by?: string;
  updated_by?: string;
  created_date?: string;
  updated_date?: string;
  citizen_logged_in?: boolean;
}

export interface CitizenLoginResponseModel {
  login_status?: string;
  citizen_profile?: CitizenProfileModel;
  error?: string;
  citizen_logged_in?: boolean;
  citizen_id?: string;
  name?: string;
  mobile_no?: string;
  address?: string;
}

export interface ChangePasswordModel {
  phone?: string;
  oldPassword?: string;
  password?: string;
  confirmPassword?: string;
}

export interface CitizenChangePasswordResponseModel {
  message?: string;
  status?: string;
}

export interface CitizenForgotPasswordModel {
  phone?: string;
}

export interface CitizenForgotPasswordResponseModel {
  message?: string;
  status?: string;
}

export interface AttendantForgotPasswordModel {
  phone?: string;
}

export interface AttendantForgotPasswordResponseModel {
  message?: string;
  status?: string;
}

export interface VehicleArrayModel {
  vehicleNo?: any;
  vehicleType?: any;
}

export interface CitizenSignupModel {
  mobile_no?: string;
  name?: string;
  address?: string;
  gender?: string;
  email?: string;
  password?: string;
  vehicleArray?: VehicleArrayModel[];
}

export interface CitizenSignupResponseModel {
  status?: string;
  mobile_no?: string;
  error?: string;
}

export interface CitizenDeRegistrationModel {
  citizen_id?: string;
}

export interface CitizenDeRegistrationResponseModel {
  message?: string;
  status?: string;
}

export interface TermsAndConditionsResponseModel {
  message?: string;
  status?: string;
}

export interface ContactUsResponseModel {
  message?: string;
  status?: string;
}

export interface ParkingArrayModel {
  parking_id?: string;
  vendor_id?: string;
  vendor_no?: string;
  vendor_type?: any;
  sub_his_id?: string;
  area_id?: string;
  location?: string;
  latitude?: string;
  start_position?: string;
  end_position?: string;
  longitude?: string;
  image_url?: string;
  vendor_status?: string;
  status?: string;
  created_by?: string;
  create_date?: string;
  active?: string;
  position?: string;
}

export interface ParkingZoneResponseModel {
  status?: string;
  parking?: ParkingArrayModel[];
}

export interface VehicleTypeArray {
  vpv_id?: string;
  sub_his_id?: string;
  vendor_id?: string;
  parking_id?: string;
  vt_id?: string;
  price?: string;
  num_of_vehicles?: string;
  active?: string;
  vehicle_type_id?: string;
  vehicle_type?: string;
  Total_slot?: string;
  Rate?: string;
  Occupied?: string;
  Free_slots?: number;
  corp_sub_id?: string;
  advance_slot?: string;
  plan_id?: string;
  free_minute?: string;
  occupied_advance_slot?: string;
}

export interface VehicleListModel {
  status?: string;
  parkings?: VehicleTypeArray[];
}

export interface ValidateUserResponseModel {
  value?: string;
  status?: string;
}

export interface ViewPlansArray {
  free_minute?: string;
  vt_id?: string;
  scheme_id?: string;
  one_time?: string;
  from_hour?: string;
  upto_price?: string;
  repeat_hour?: string;
  charge?: string;
}

export interface ViewPlanModel {
  status?: string;
  plans?: ViewPlansArray[];
  message?: string;
  disclaimer?: string;
}

export interface Vehicle {
  vpv_id?: string;
  sub_his_id?: string;
  vendor_id?: string;
  parking_id?: string;
  vt_id?: string;
  price?: string;
  num_of_vehicles?: string;
  active?: string;
  vehicle_type_id?: string;
  vehicle_type?: string;
  Total_slot?: string;
  Rate?: string;
  Occupied?: string;
  Free_slots?: number;
}

export interface MapParkingSpaceArrayModel {
  parking_id?: string;
  vendor_id?: string;
  vendor_no?: string;
  vendor_type?: any;
  sub_his_id?: string;
  area_id?: string;
  location?: string;
  latitude?: string;
  start_position?: string;
  end_position?: string;
  longitude?: string;
  image_url?: string;
  vendor_status?: string;
  status?: string;
  created_by?: string;
  create_date?: string;
  active?: string;
  vehicles?: Vehicle[];
}

export interface MapAreaResponseModel {
  status?: string;
  parkingspace_list?: MapParkingSpaceArrayModel[];
}

export interface CheckAdvanceBookingRequestModel {
  parking_id?: string;
  vt_id?: string;
  vendor_id?: string;
}

export interface CheckAdvanceBookingDataModel {
  adv_id?: string;
  vendor_id?: string;
  adv_name?: string;
  parking_id?: string;
  pass_type_id?: string;
  booking_type_id?: string;
  vt_id?: string;
  price?: string;
  free_slot?: number;
}

export interface CheckAdvanceBookingResponseModel {
  status?: string;
  message?: string;
  data?: CheckAdvanceBookingDataModel;
}

export interface AdvanceBookingRequestModel {
  vendor_id?: string;
  citizen_id?: string;
  parking_id?: string;
  advance_id?: string;
  cars_no?: string;
}

export interface AdvanceBookingResponseModel {
  status?: string;
  message?: string;
  data?: any;
}

export interface AdvanceBookingTokenRequestModel {
  vendor_id?: string;
}

export interface AdvanceBookingTokenItemModel {
  id?: string;
  vendor_id?: string;
  customer_id?: string;
  token_no?: string;
  parking_id?: string;
  ref_no?: string;
  status?: string;
  location?: string;
  start_position?: string;
  end_position?: string;
}

export interface AdvanceBookingTokenResponseModel {
  status?: string;
  message?: string;
  data?: AdvanceBookingTokenItemModel[];
}

export interface EntryModel {
  parking_id?: string;
  vehicle_type_id?: string;
  vehicle_number?: string;
  vendor_userid?: string;
  mobile?: string;
  entry_time?: string;
  token_no?: string;
}

export interface EntryResponseModel {
  agencyName?: string;
  bookingStatus?: string;
  entryTime?: string;
  html?: string;
  msg?: string;
  parkingLocation?: string;
  status?: string;
  tokenNo?: string;
  vehicleNo?: string;
  vehicleType?: string;
}

export interface ExitModel {
  allotmentId?: string;
  fare?: string;
  exempted?: string;
  coupon?: string;
  time?: string;
}

export interface ExitResponseModel {
  agencyName?: string;
  bookingStatus?: string;
  entryTime?: string;
  exit_time?: string;
  fare?: string;
  hourdiff?: string;
  html?: string;
  msg?: string;
  parkingLocation?: string;
  status?: string;
  tokenNo?: string;
  vehicleNo?: string;
  vehicleType?: string;
}

export interface FareModel {
  allotmentId?: string;
  time?: string;
}

export interface FareResponseModel {
  fare?: string;
  token_no?: string;
  status?: string;
  hourdiff?: string;
  exit_time?: string;
  error?: string;
  type?: string;
  gstAmount?: string;
  gstPercentage?: string;
  baseFare?: string;
}

export interface ParkedVehicleModel {
  allotment_id?: string;
  citizen_id?: string;
  coupon?: string;
  entry_time?: string;
  exempted?: string;
  exit_time?: string;
  fare?: string;
  mobile?: string;
  parking_id?: string;
  sub_his_id?: string;
  token_no?: string;
  type?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  vendor_userid?: string;
  vt_id?: string;
}

export interface ParkedVehicleResponseModel {
  status?: string;
  parkedvehicle_list?: ParkedVehicleModel[];
}

export interface ParkedVehicleList {
  parking_id?: string;
}

export interface ParkingHistoryArrayModel {
  allotment_id?: string;
  parking_id?: string;
  vendor_userid?: string;
  citizen_id?: string;
  mobile?: string;
  vehicle_number?: string;
  vt_id?: string;
  entry_time?: string;
  exit_time?: string;
  fare?: string;
  exempted?: string;
  coupon?: string;
  position?: string;
  location?: string;
  vehicle_type?: string;
}

export interface ParkingHistoryResponseModel {
  status?: string;
  error?: string;
  parking_history?: ParkingHistoryArrayModel[];
}

export interface AdvertisementModel {
  ad_id: string;
  ad_title: string;
  ad_description: string;
  ad_filename: string;
  ad_file_extension?: any;
  ad_external_link: string;
  created_date: string;
  status: string;
}

export interface AdvertisementResponseModel {
  advertisements: AdvertisementModel[];
  status: string;
}

export interface OCRModelResponse {
  status?: string;
  numberPlate?: string;
  mobileNo?: string;
  error?: string;
}

export interface OCRMobileResponseModel {
  status?: string;
  mobileNo?: string;
}

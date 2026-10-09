export type RootStackParamList = {
  Landing: undefined;
  AttendantLogin: undefined;
  CitizenLogin: undefined;
  AttandantForgotPassword: undefined;
  ForgotPassword: undefined;
  CustomerRegistration: undefined;
  ParkingZone: { loginDetail?: any } | undefined;
  Entry: { parking_id: string; vehicle_type_id: string; vendor_userid: string };
  Exit: { parking_id: string; startLocation: string; endLocation: string };
  Map: undefined;
  CitizenParkingHistory: undefined;
  BookingHistory: undefined;
  Coupons: undefined;
  Support: undefined;
  Logout: undefined;
  ChangePassword: undefined;
  CustomerDeregistration: undefined;
};

export type DrawerParamList = {
  MainStack: undefined;
};

export type MenuKind = 'citizen' | 'guest' | 'none';

export interface MenuPage {
  title: string;
  route: keyof RootStackParamList;
  icon: any;
  openInAppBrowser?: boolean;
}

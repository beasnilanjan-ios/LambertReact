import { MenuPage } from './types';

const icons = {
  home: require('../assets/icon/home.png'),
  deregistration: require('../assets/icon/De-registration.png'),
  coupons: require('../assets/icon/Coupons.png'),
  bookingHistory: require('../assets/icon/Booking-History.png'),
  contactUs: require('../assets/icon/Contact-Us.png'),
  support: require('../assets/icon/Suport.png'),
  terms: require('../assets/icon/Terms.png'),
  password: require('../assets/icon/Password.png'),
  logout: require('../assets/icon/Logout.png'),
  exit: require('../assets/icon/exit.png'),
};

export const citizenMenu: MenuPage[] = [
  { title: 'Home', route: 'Map', icon: icons.home },
  { title: 'De-registration', route: 'CustomerDeregistration', icon: icons.deregistration },
  { title: 'Coupons', route: 'Coupons', icon: icons.coupons },
  { title: 'Booking History', route: 'CitizenParkingHistory', icon: icons.bookingHistory },
  { title: 'Contact Us', route: 'Map', icon: icons.contactUs, openInAppBrowser: true },
  { title: 'Support', route: 'Support', icon: icons.support },
  { title: 'Terms & Conditions', route: 'Map', icon: icons.terms, openInAppBrowser: true },
  { title: 'Change Password', route: 'ChangePassword', icon: icons.password },
  { title: 'Logout', route: 'Logout', icon: icons.logout },
];

export const guestMenu: MenuPage[] = [
  { title: 'Home', route: 'Map', icon: icons.home },
  { title: 'Booking History', route: 'CitizenParkingHistory', icon: icons.bookingHistory },
  { title: 'Contact Us', route: 'Map', icon: icons.contactUs, openInAppBrowser: true },
  { title: 'Exit', route: 'Landing', icon: icons.exit },
];

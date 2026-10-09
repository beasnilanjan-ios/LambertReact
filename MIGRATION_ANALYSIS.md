# MIGRATION_ANALYSIS — Lambert Parking (Ionic 3 → React Native)

**Source of truth (read-only, never modified):**
`/Users/beasimac/Documents/Lambert Parking/ionic/Lambert Parking v2`

**Migration target:**
`/Users/beasimac/Documents/Lambert Parking/react native`

**Phase:** 1 — ANALYSIS (complete)

---

## 0. Application overview

| Item | Value |
|---|---|
| App name | Lambert Parking |
| Android package / iOS bundle | `com.BCS.LambertParking` |
| Version | 0.0.1 (versionCode 1) |
| Framework | Ionic 3.9.2, Angular 5.2.11, TypeScript 2.6, Cordova |
| Orientation | Portrait only (Android `screenOrientation="portrait"`, iOS Portrait + PortraitUpsideDown) |
| Languages | No i18n — all strings hard-coded English |
| Roles | **Guest**, **Citizen**, **Attendant** |
| minSdk / targetSdk | 22 / 34 |
| Live API base | `http://182.73.216.94/lambert.beas.in/webservice/` (cleartext HTTP allowed: `usesCleartextTraffic=true`, ATS `NSAllowsArbitraryLoads=true`) |
| Maps key | `AIzaSyBWP4VOuMWRw0BTi014O3wFtZ_AcACf5Ns` (Android + iOS + JS SDK, same key) |

**Three distinct flows:**

1. **Attendant flow** — Landing → Attendant Login → Parking Zone → (Entry / Exit / View Plan) → Bluetooth/Printer/Boom-gate.
2. **Citizen flow** — Landing → Citizen Login → Map (+ advance booking, history, coupons, profile, change password, deregistration, support, terms, logout).
3. **Guest flow** — Landing → Map (reduced menu, no citizen_id → booking attempts show "Citizen ID not found").

---

## 1. SCREEN INVENTORY

24 page directories exist; 2 are dead/empty. All must be accounted for.

### 1.1 Live screens

| # | Ionic page | Route role | Status |
|---|---|---|---|
| 1 | `landing` | Root fallback / role chooser | Live |
| 2 | `login` (Attendant Login) | Attendant auth | Live |
| 3 | `citizen-login` | Citizen auth | Live |
| 4 | `forgot-password` | Citizen forgot password | Live |
| 5 | `attandant-forgot-password` | Attendant forgot password | Live |
| 6 | `customer-registration` (Sign Up) | Citizen signup (reachable from citizen-login) | Live |
| 7 | `new-profile` (Sign Up, bg-image variant) | **Orphan** — no live navigation to it | Registered but unreachable |
| 8 | `change-password` | Citizen change password (menu) | Live |
| 9 | `attandant-change-password` | Empty stub (blank page, title = raw slug) | Registered, unreachable |
| 10 | `map` | Citizen/Guest home | Live (critical) |
| 11 | `parking-zone` | Attendant home | Live (critical) |
| 12 | `view-plan-modal` | Modal — tariff plans | Live |
| 13 | `entry` | Vehicle entry + OCR + print + gate | Live (critical) |
| 14 | `exit` | Parked-vehicle list + exit + gate | Live (critical) |
| 15 | `exit-modal` | Modal — fare / receipt / Exit & Print | Live |
| 16 | `bluetooth-modal` | Modal — pair/connect printer | Live |
| 17 | `citizen-parking-history` | Menu item labelled **"Booking History"** + map "History" button | Live |
| 18 | `booking-history` | **Empty stub** (navbar + empty content) | Registered, unreachable |
| 19 | `coupons` | Advance-booking token list (menu) | Live |
| 20 | `customer-deregistration` | Menu | Live |
| 21 | `support` | Menu — heading only, decorative | Live |
| 22 | `terms-n-conditions` | From new-profile only; heading wrongly says "Contact Us" | Live but effectively orphan |
| 23 | `contact-us` | **Never pushed** — menu "Contact Us" goes to Map + opens InAppBrowser | Orphan |
| 24 | `logout` | Menu — confirmation page | Live |

> Migration note: every page above will be created as an RN screen (including stubs, for parity), but **navigation reachability must match exactly** — do not wire up orphan screens that the Ionic app never reaches.

### 1.2 Empty directory

- `src/pages/camera-scan-modal/` — **0 files**, not registered. OCR lives inside `entry.ts`. No RN screen needed (document only).

---

## 2. NAVIGATION MAP

### 2.1 Root page selection (app startup — exact logic)

Inputs read at startup:
- `localStorage['rememberme']` (citizen flag)
- `localStorage['attandantRememberme']` (attendant flag)

Decision tree:

1. If `attandantRememberme === 'true'`:
   - writes `rememberme = 'false'`
   - reads NativeStorage `NSUDIsLoggedIn`:
     - `=== 'true'` → **root = ParkingZone**
     - otherwise (including `""` / error) → **root = Landing**
2. Else if `rememberme === 'true'`:
   - writes `attandantRememberme = 'false'`
   - reads NativeStorage `CitizenIsLoggedIn`:
     - `=== 'true'` → **root = Map** (and installs citizen menu)
     - otherwise → **root = Landing**
3. Else → **root = Landing**

### 2.2 Landing page actions

| Button (exact label) | Action |
|---|---|
| `For Citizen` | publishes `citizen:loggedin` flag (menu = citizen menu) → **push CitizenLogin** |
| `For Attendant` | publishes `attendant:loggedin` → **push AttendantLogin** |
| `For Guest` | publishes `guest:visited` → **setRoot(Map)** (guest menu) |

Note: the citizen menu is installed at *button press*, before login succeeds.

### 2.3 Full navigation graph

**setRoot (stack reset) calls:**

| From | To |
|---|---|
| Landing | Map (guest) |
| AttendantLogin back / CitizenLogin back | Landing |
| AttendantLogin success | *(push, not setRoot)* ParkingZone |
| CitizenLogin success | Map |
| ParkingZone (session invalid / blocked / logout / back-confirm Yes) | Landing |
| Logout Yes | Landing (after `localStorage.clear()` + `nativeStorage.clear()`) |
| Logout No / back | Map |
| ChangePassword back / success | Map |
| CustomerDeregistration back / success / No | Map (success-fail path → Landing) |
| CustomerRegistration back | CitizenLogin (success = **push** CitizenLogin) |
| ForgotPassword back / success | CitizenLogin |
| AttendantForgotPassword back / success | AttendantLogin |
| BookingHistory back / CitizenParkingHistory back / Coupons back / Support back / Logout back | Map |
| ContactUs (if ever reached) | Map after opening InAppBrowser |
| ViewPlanModal back | ParkingZone (registered from a modal!) |
| Any menu item tap | `setRoot(page)` (+ close menu) |

**push calls:**

| From | To | Params |
|---|---|---|
| AttendantLogin success | ParkingZone | `{ loginDetail }` |
| CitizenLogin | CustomerRegistration, ForgotPassword | — |
| AttendantLogin | AttandantForgotPassword | — |
| ParkingZone Entry card | Entry | `{ parking_id, vehicle_type_id, vendor_userid }` |
| ParkingZone Exit card | Exit | `{ parking_id, startLocation, endLocation }` |
| Map "History" button | CitizenParkingHistory | — |
| Exit success path | — | (modal dismissal refreshes list) |

**Modals:**

| From | Modal | Params |
|---|---|---|
| ParkingZone "View Plan" | ViewPlanModal | `{ viewPlanArray, vehicleType, disclaimer }` |
| Exit (fare computed) | ExitModal | `{ baseFare, gstAmount, gstPercentage, token_no, fare, totalTime, vehicleType, allotmentId, time }` |
| Entry / Exit (BT missing) | BluetoothModal | `{}` |

**App shell:** `<ion-menu swipeEnabled="false">` (left drawer, swipe disabled, hamburger `nav-bar.png`), `<ion-nav swipeBackEnabled="false">` (edge-swipe back disabled).

### 2.4 Side menu

Header title: **`Menu`**. Items rendered with 32×32 PNG icon + label. `openPage()` → close menu → `setRoot`.

**Citizen menu (9 items):**

| # | Label | Target | Icon asset |
|---|---|---|---|
| 1 | `Home` | Map | `home.png` |
| 2 | `De-registration` | CustomerDeregistration | `De-registration.png` |
| 3 | `Coupons` | Coupons | `Coupons.png` |
| 4 | `Booking History` | **CitizenParkingHistory** | `Booking-History.png` |
| 5 | `Contact Us` | Map + **open InAppBrowser** with server URL | `Contact-Us.png` |
| 6 | `Support` | Support | `Suport.png` (sic) |
| 7 | `Terms & Conditions` | Map + **open InAppBrowser** with server URL | `Terms.png` |
| 8 | `Change Password` | ChangePassword | `Password.png` |
| 9 | `Logout` | Logout | `Logout.png` |

**Guest menu (4 items):** `Home`(Map), `Booking History`(CitizenParkingHistory), `Contact Us`(Map + IAB), `Exit`(setRoot **Landing**) — icon `exit.png`.

**Attendant:** menu array never assigned → menu is effectively empty; ParkingZone has no hamburger button (hideBackButton, no menuToggle) → attendant never opens the menu. RN: attendant stack must not expose a drawer.

**Menu-swipe:** disabled. **Menu hamburger appears on:** map, coupons, support, logout, booking-history, citizen-parking-history, contact-us, terms-n-conditions, customer-deregistration, change-password.

### 2.5 Android hardware back button (REQUIRED behavior)

Ionic registers `platform.registerBackButtonAction(..., 0)` per component, no unregister → last-registered handler wins.

| Current screen | Back behavior |
|---|---|
| Landing | **Exit-confirm alert**: title `Confirm Exit`, message `Do you want Exit?`, buttons `Cancel` / `Yes` → `platform.exitApp()` |
| Map | Same exit-confirm alert |
| ParkingZone | Same exit-confirm alert; `Yes` also runs `localStorage.clear()` before exit |
| App-level (any other root) | Same exit-confirm alert |
| AttendantLogin / CitizenLogin | `setRoot(Landing)` |
| CustomerRegistration | `setRoot(CitizenLogin)` |
| ForgotPassword | `setRoot(CitizenLogin)` |
| AttendantForgotPassword | `setRoot(AttendantLogin)` |
| ChangePassword / Deregistration / Coupons / Support / Logout / CitizenParkingHistory / BookingHistory | `setRoot(Map)` |
| ViewPlanModal (open) | `setRoot(ParkingZone)` (dismisses modal + resets attendant stack) |
| Entry / Exit | Default pop (Ionic back button in navbar) |
| BluetoothModal / ExitModal | Falls through to the last-registered handler (i.e. screen below) |

There is **no** "press back twice to exit" toast — always the `Confirm Exit` / `Do you want Exit?` alert, guarded per-screen by `alertShown`.

**RN plan:** a single `BackHandler` dispatcher keyed on current route reproducing exactly the table above (modal-open → close modal / screen-specific setRoot targets / exit-confirm on Landing+Map+ParkingZone).

### 2.6 iOS back navigation

- Ionic navbar back button shown wherever the page was *pushed* (Entry, Exit, CitizenLogin, AttendantLogin, ForgotPassword, Registration).
- Hamburger replaces back on menu screens.
- ParkingZone / ViewPlanModal: `[hideBackButton]="true"` (ViewPlan uses a custom `back.png` image button → dismiss).
- Swipe-back disabled everywhere → RN: `gestureEnabled: false` on stack screens.

---

## 3. API INVENTORY (DO NOT CHANGE CONTRACT)

**Rule: every request is `multipart/form-data` for POSTs (FormData field names below are verbatim), plain JSON GETs. No JSON-body POSTs anywhere.**

Base: `http://182.73.216.94/lambert.beas.in/webservice/` (constants in `src/Support/ApiConstant.ts`).

| # | Method | Endpoint | Caller | FormData / params | Success condition |
|---|---|---|---|---|---|
| 1 | POST | `login` | AttendantLogin | `phone`, `password` | `login_status == "success"` |
| 2 | POST | `citizenLogin` | CitizenLogin | `phone`, `password` | `login_status == "success"` (fail → show `response.error`) |
| 3 | POST | `citizenSignup` | CustomerRegistration | `name`, `address`, `mobile_no`, `email`, `password` | `status == "success"` |
| 4 | POST | `change_password` | ChangePassword | `phone`, `password` (NEW only; old/confirm never sent) | `status === "success"` |
| 5 | POST | `forgot_password` | ForgotPassword | `phone` | `status == "success"` |
| 6 | POST | `attendent_forgot_password` | AttendantForgotPassword | `phone` | `status == "success"` (server spelling `attendent`) |
| 7 | POST | `deregister_citizen` | CustomerDeregistration | `citizen_id` | `status == "success"` |
| 8 | GET | `get_lambert_address` | app startup, ContactUs | — | `status == "success"` → `message` = URL |
| 9 | GET | `get_terms_n_cond` | app startup, Registration, TermsNConditions | — | `status == "Success"` ← **capital S** |
| 10 | GET | `attendent_status/{vendorUserId}` | ParkingZone (Entry/Exit taps) | — | `status=="success"` AND `value == "1"` |
| 11 | GET | `users_parking/{vendorUserId}` | ParkingZone | — | `status=="success"` + non-empty `parking[]` |
| 12 | GET | `get_parking_details/{parkingId}` | ParkingZone | — | `status=="success"` + non-empty `parkings[]` |
| 13 | GET | `view_parking_plan/{parkingId}/{vehicleTypeId}` | ParkingZone | — | `status=="success"` |
| 14 | GET | `parkingspace_list` | Map, Coupons | — (no lat/lng/radius — full list) | `status == "success"` |
| 15 | POST | `check_advance_booking_request` | Map InfoWindow | `parking_id`, `vt_id`, `vendor_id` (one call per vehicle type) | `status=='success' && Number(data.free_slot)>0`; special: message `sorry! no plan is assigned` → hide button |
| 16 | POST | `advance_booking_request` | Map InfoWindow | `vendor_id`, `citizen_id`, `parking_id`, `advance_id`, `cars_no` (`'1'`) | `message.toLowerCase() === 'sucessfull'` ← **server typo is the contract** |
| 17 | POST | `advance_booking_token` | Map, Coupons | `vendor_id` | Coupons: `status=='success' && data.length>0` + non-blank `token_no` |
| 18 | POST | `parking_entry` | Entry | `parking_id`, `mobile`, `vehicle_number`, `vehicle_type_id`, `vendor_userid`, `entry_time`, `token_no` | `status.toLowerCase()=="success"`; branches: `"fail"` → "Vehicle is already inside", `"invalidtoken"` → `response.msg` |
| 19 | POST | `vendor_parkedvehicle_list` | Exit | `parking_id` | `status=="success"` |
| 20 | POST | `calculate_fare` | Exit (normal + exempted) | `allotment_id`, `time` (moment `YYYY-MM-DD HH:mm:ss`) | normal: `status.toLowerCase()=="success"`; exempted: `status=="success"` |
| 21 | POST | `parking_exit` | Exit, ExitModal | `allotment_id`, `fare`, `exempted`, `coupon`, `time` | `status=="success"` |
| 22 | POST | `getOCR` (absolute URL) | Entry Auto Scan | multipart file field `image` = `numberplate.jpg` (image/jpeg), base64 → Blob | `status=='success' && numberPlate.trim().length>0` |
| 23 | GET | `citizen_parking_history/{mobile}` | CitizenParkingHistory | mobile in URL path | `status == "success"` → `parking_history[]` |

**Endpoint quirks that MUST be preserved:**
- Advance-booking POSTs use `responseType:'text'` + tolerant parse: find `lastIndexOf('{"message"')`, else `indexOf('{')`, `JSON.parse` from there; fallback `{status:'fail', message:'Invalid response', data:{free_slot:0}}`.
- `terms` success status is `"Success"`, everything else is `"success"`.
- Exit modal sends `coupon: ''` and `exempted: ''` (never populated) — preserve.
- `change_password` sends only `phone` + new `password`.
- Loader dismissal happens synchronously after `.subscribe()` in many screens (spinner often never visible) — RN may dismiss on completion; user-visible result is effectively "no long spinner", so dismissing on response is equivalent *except* the 50s timeout case. Keep loaders brief/equivalent.

**Unused endpoints (do not implement):** `area_parking_list/`, `citizenMobCheck`, `getOcrMob/` (commented), file-transfer upload (commented).

**HTTP error handling in original:** only AttendantLogin shows a transport-error alert (`Login failed` / `Unable to reach the login service (HTTP x)...`). All other calls have no error callback (console only). Preserve observable behavior (alerts only where the original shows them).

**Logging:** `HttpLoggingInterceptor` prints `[HTTP] -> METHOD url`, `[HTTP] <- status url (ms)` for every call. Reproduce as a dev-only console log wrapper.

---

## 4. STORAGE INVENTORY (preserve keys & values)

### 4.1 "localStorage" keys → RN AsyncStorage (same key names)

| Key | Values | Written by | Read by |
|---|---|---|---|
| `rememberme` | `"true"` / `"false"` / cleared | CitizenLogin, app startup cross-toggle, Logout | Startup root decision |
| `attandantRememberme` | `"true"` / `"false"` / `null` | AttendantLogin, ParkingZone logout, app startup cross-toggle | Startup root decision |
| `phone` | citizen mobile | CitizenLogin, Logout(`null`) | ChangePassword prefill |
| `password` | **plaintext password** | CitizenLogin, Logout(`null`) | ChangePassword old-password check (client-side) |
| `citizen_id` | `String(id)` | CitizenLogin | Map advance booking, Deregistration |
| `isCitizenLogin` | `null` only | Logout | none (dead) |

Logout sequence (exact): `localStorage.clear()` → then re-set `phone`/`password`/`isCitizenLogin` to literal `"null"` → `nativeStorage.clear()` → setRoot Landing.

### 4.2 NativeStorage keys → RN equivalent persistent store (same key names)

| Key | Values | Written by | Read by |
|---|---|---|---|
| `NSUDIsLoggedIn` | `"true"` | AttendantLogin | Startup (attendant root) |
| `NSUDloginDetail` | full login response + normalized `vender_user_id` | AttendantLogin | ParkingZone |
| `CitizenIsLoggedIn` | `"true"` | CitizenLogin | Startup (citizen root) |
| `EnableBoomGate` | `"Nil"` (login) / `"YES"` / `"NO"` | AttendantLogin, Entry, Exit | Entry/Exit gate button |
| `DeviceConnected` | `"true"` / `"false"` / `"notSet"` | BluetoothModal, AttendantLogin, Entry, Exit, **app pause → `"false"`** | Entry/Exit gate check |
| `NSUDIsCitizenLoggedIn` | `"true"` | new-profile (orphan) | never read |
| `NSUDCitizenLoggedInMobile` | mobile | new-profile | never read |
| `NSUDCitizenDetail` | response object | new-profile | never read |

`nativeStorage.clear()` call sites: ParkingZone (blocked / logout), Logout.

**No sessionStorage, no @ionic/storage, no cookies.**

---

## 5. MODELS (→ TS interfaces, keep field names incl. typos)

18 files in `src/Model/`. Key ones:

- `login.model.ts`: `LoginModel {phone?, password?}`; `LoginResponseModel {vendor_logged_in?, vender_user_id?, vendor_user_id?, name?, vendor_id?, vendor_phone_no?, profile_picture?, user_status?, login_status?}` — **both spellings of vendor id are part of the contract**; login normalizes `vender_user_id || vendor_user_id`.
- `citizenLogin.model.ts`: `CitizenLoginModel` (required phone/password), `CitizenLoginResponseModel {login_status?, citizen_profile?, error?, citizen_id?, mobile_no?, ...}`, `CitizenProfileModel`, `ChangePasswordModel`, `CitizenChangePasswordResponseModel {message?, status?}`, forgot-password request/response pairs (citizen + attendant).
- `citizenSignup.model.ts`: `CitizenSignupModel {mobile_no?, name?, address?, gender?, email?, password?, vehicleArray?}`, `CitizenSignupResponseModel {status?, mobile_no?, error?}`, deregistration pair.
- `parkingZone.model.ts`: `ParkingZoneResponseModel`, `ParkingArrayModel` (+`position?`), `VehicleTypeArray` (+`advance_slot?, plan_id?, free_minute?, occupied_advance_slot?`), `VehicleListModel`, `ValidateUserResponseModel {value?, status?}`, `ViewPlanModel {status?, plans?, message?, disclaimer?}`, `ViewPlansArray {free_minute?, vt_id?, scheme_id?, one_time?, from_hour?, upto_price?, repeat_hour?, charge?}`.
- `map.model.ts`: `Vehicle`, `MapParkingSpaceArrayModel`, `MapAreaResponseModel`, `CheckAdvanceBooking*`, `AdvanceBooking*`, `AdvanceBookingTokenItemModel {id?, vendor_id?, customer_id?, token_no?, parking_id?, ref_no?, status?, location?, start_position?, end_position?}`.
- `entry.model.ts` / `exit.model.ts` / `calculate.fare.model.ts` / `parked.vehicle.model.ts` / `parkingHistory.model.ts` / `advertisement.model.ts` / `contactUs.model.ts` / `termsAndConditions.model.ts` / `ocr.model.ts` / `ocrMobile.model.ts`.
- `parkingEntry.model.ts` — **dead file, never imported**.

---

## 6. NATIVE PLUGINS → REACT NATIVE EQUIVALENTS

| Ionic/Cordova usage | Where | RN target (proposed) |
|---|---|---|
| Google Maps **JS SDK** via `<script>` (NOT cordova-plugin-googlemaps) | Map | `react-native-maps` (Google provider on Android+iOS) |
| Google Places autocomplete (`ngx-google-places-autocomplete`) | Map search | Places autocomplete widget/library compatible with RN maps |
| `cordova-plugin-geolocation` → `Geolocation.getCurrentPosition()` (no watch) | Map, current-location button | `@react-native-community/geolocation` |
| `cordova-plugin-camera` `getPicture` (DATA_URL, JPEG, quality 90, CAMERA source, correctOrientation, no save) | Entry Auto Scan | RN camera/image picker returning **base64 JPEG** |
| Tesseract.js | **commented out — NOT used**; OCR is server-side (`getOCR`) | Do NOT add an on-device OCR lib; keep server OCR |
| `cordova-plugin-bluetooth-serial` (`isEnabled/list/connect/subscribe/write/disconnect/enable`) | BluetoothModal, Entry, Exit, printer | RN Bluetooth Serial equivalent (classic RFCOMM SPP), Android+iOS capable |
| `esc-pos-encoder-ionic` + `printer-commands.ts` | Entry / ExitModal print | Same JS encoder (pure JS) + Bluetooth write adapter |
| `cordova-plugin-nativestorage` | 8 keys (§4.2) | AsyncStorage (or MMKV) with identical key names |
| `localStorage` | 6 keys (§4.1) | AsyncStorage with identical key names |
| `cordova-plugin-inappbrowser` (`_blank`, options `{zoom:'no', mediaPlaybackRequiresUserAction:'no', closebuttoncaption:'Done'}`) | Contact Us / Terms / registration T&C | `react-native-inappbrowser-reborn` (or SFSafariViewController/Chrome Custom Tabs equivalent) |
| `@ionic-native/keyboard` (`keyboard.hide()`) | forms (Enter key) | RN `Keyboard.dismiss()` |
| `cordova-plugin-statusbar` `styleLightContent()` | startup | `StatusBar` API (`light-content`) |
| `cordova-plugin-splashscreen` (delay 3000 ms, fade 300 ms, no spinner, manual hide) | startup | Splash lib showing **existing splash artwork**, hidden after JS ready (~3 s behavior) |
| `cordova-plugin-whitelist` / transport-security | cleartext HTTP | Android `usesCleartextTraffic=true` + iOS ATS arbitrary loads |
| File / FileTransfer | injected but **unused** (commented) | Do not add |
| Sunmi inner printer | **commented out** | Do not add |

**Android permissions (from AndroidManifest):** `INTERNET`, `CAMERA`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `WRITE_EXTERNAL_STORAGE`, `ACCESS_NETWORK_STATE`, `BLUETOOTH`, `BLUETOOTH_ADMIN`; `uses-feature camera required=false`, GPS. Runtime permissions currently requested only for camera (via plugin). **Gap to fix carefully in RN:** Android 12+ needs `BLUETOOTH_CONNECT/SCAN`; Android 13+ media/location implications — request at runtime where needed without changing UX flow.

**iOS Info.plist strings:** `NSCameraUsageDescription = "Lambert Parking need to access camera"`, `NSPhotoLibraryUsageDescription = "Lambert Parking need to access your photo library"`, `NSLocationAlwaysUsageDescription`/`NSLocationWhenInUseUsageDescription = "Lambert Parking need to access your current location"`. No Bluetooth usage string (gap: add `NSBluetoothAlwaysUsageDescription` for iOS BT). ATS arbitrary loads = true. Portrait only.

---

## 7. MAP (critical screen) — behavior spec

1. On load: `getCurrentPosition()` → if success, center map on it (`zoom: 13`, `mapTypeId: roadmap`, no zoom/streetview/scale controls, country restriction `IN`). Marker at user position: icon `assets/icon/mylocation.png`, title `I'm here !!!`, InfoWindow content `<div><h3>Lambert Parking</h3></div>`.
   - **Quirk preserved:** a synchronous `if (!boolGPS)` check right after the async call fires alert `Lambert PArking` / `Current location not found. Please enable your GPS from phone settings and wait a few seconds` on *every* map (re)build. (Reproduce the same user-visible alert behavior.)
2. `GET parkingspace_list` → one marker per zone:
   - Free slots = **sum of `vehicles[].Free_slots`**
   - Icon: `parking-marker-active.svg` (blue `#1565C0`) if total > 0 else `parking-marker-full.svg` (red `#C62828`); scaled 36×44, anchor bottom-center.
   - Marker title = `location`.
3. Marker tap → InfoWindow (single active window), HTML-ish content:
   - Close `×` button top-right.
   - Orange title bar (`#ff970b`, white bold 13px): `start_position To end_position`.
   - Per vehicle: `vehicle_type` (navy `#034083`) then `Free Slot(s): N` / `Fare/hr: ₹ price` (13px).
   - Advance-booking button states: `Checking...` (grey `#6c757d`, disabled) → `Advance Booking` (green `#28a745`) or `Advance Booking Slot is Full` (red `#dc3545`, disabled); hidden entirely when all vehicles return message `sorry! no plan is assigned`.
   - InfoWindow opens → runs `check_advance_booking_request` per vehicle type (cached in `advanceBookingDataMap`).
4. `Advance Booking` tap → requires `localStorage['citizen_id']` (else alert `Citizen ID not found. Please log in again.`) → `advance_booking_request` (`cars_no='1'`) → on message `sucessfull` → alert with raw server message → on OK → `advance_booking_token` (response only console-logged on map).
5. Current-location button (`curLoc.png`, blue circle `#427feb`, 50px, right side) → rebuilds the whole map (new geolocation, new map instance, zoom 13, refetch zones).
6. Search: bare Google Places autocomplete input in a floating white pill (width 98%, radius 20px, shadow) → on place selected: rebuild map centered on place (`zoom: 14`) + refetch zones. No marker for chosen place.
7. Advertisements: `GET get_advertisements_list` → `<ion-slides autoplay 5000ms loop speed 500>` of `<img src=ad_filename>` at 150px height, full width.
8. Header: hamburger (left), title `Lambert Parking`, orange outline `History` button (right) → push CitizenParkingHistory.
9. Side menu + back-button exit confirm as per §2.

**RN mapping:** `react-native-maps` `Marker` + `Callout` (custom-styled to the exact InfoWindow design), `UrlMapMarkerImage` or bundled PNG of the two SVG markers (RN map markers cannot render SVG directly — generate PNGs from the exact SVG files), `PROVIDER_GOOGLE`, `showsCompass/zoomControl` equivalents hidden, `initialRegion` from geolocation.

---

## 8. ATTENDANT FLOW — behavior spec

### 8.1 ParkingZone
- Header: white, title `Lambert Parking`, **left** `power.png` button (logout), no back, no hamburger.
- Loads `loginDetail` from nav params else NativeStorage `NSUDloginDetail` (normalizes `vender_user_id`).
- Dropdown 1 `Select Parking Lot` (`GET users_parking/{vendorUserId}`, auto-select first, shows `Welcome, {name}`), dropdown 2 `Select Vehicle Type` (`GET get_parking_details/{parkingId}`).
- Empty states: `No parking lot assigned to this account.` / `No vehicle type available for selected parking lot.` (red 13px `#c0392b`).
- `View Plan` button (cornflowerblue `#6495ED`) → `GET view_parking_plan/{parkingId}/{vtId}` → modal (§8.2) or alert `Oops`/`response.message`.
- Stats card (after vehicle type selected): `Total Slot`, `Total Advance Slot`, `Occupied Slot`, `Occupied Advance Slot` + tap zones **Entry** / **EXIT VEHICLE** (cards with `check1.png`/`arrow1.png`/`check2.png`, white bg, radius 8px).
- Entry/Exit taps first call `GET attendent_status/{vendorUserId}`; if `value != "1"` → alert `Alert !!!` / `Your account had been blocked due to some temporary technical difficulties. Please contact your admin` → clear NativeStorage → setRoot Landing.
- `Refresh` button (orange). Logout confirm: `Confirm logout` / `Do you want logout?` → `Cancel` / `Logout`.
- Back button → exit-confirm alert (`Yes` clears localStorage then exits app).

### 8.2 ViewPlanModal
- Header `Lambert Parking`, custom `back.png` (left, absolute) → dismiss. Title = vehicle type.
- Rows per scheme: scheme 1 → `Free Minutes / Upto (hh.mm) / Upto Price (₹) / Repeat Hour (h) / Charge (₹)`; scheme 2 → first three; scheme 3 → `Free Minutes / Repeat Hour (h) / Charge (₹)`.
- Red disclaimer `Note: {disclaimer}` when present. No API.
- Back hardware button → setRoot ParkingZone.

### 8.3 Entry
- Fields: `Enter Token Number`, `Enter Vehicle Number` (autocapitalize, maxlength 10), divider `Or`, `Auto Scan` (orange), `Mobile Number` (tel), buttons `Cancel` (red) / `Done` (navy `#034083`), images `printer.png` / `gate.png` (each 50% width).
- `Done` → validate (vehicle required; mobile optional but if present must be 10 digits → `Mobile number must be 10 digits`) → `POST parking_entry` (entry_time `YYYY-M-D H:M:S` non-padded) →
  - success → alert `Parking Entry` / `Entry Successful` / OK → **clears fields, does NOT navigate back** (deliberate: attendant must print + open gate)
  - `fail` → `Oops` / `Vehicle is already inside`
  - `invalidtoken` → `Oops` / `response.msg` + clears token
  - else → `Oops` / `Some error occured. Please try after some times`
- `Auto Scan` → camera (quality 90, JPEG base64, correctOrientation, no photo album) → `POST getOCR` multipart `image=numberplate.jpg` → fills `vehicle_number` (+ `mobile` only if server returned one, overwriting typed value) → alert `Auto Scan` / `Vehicle no.: {plate}` (+ `\nMobile no.: {x}` if present). Errors: server `error` → `Sorry`/msg; empty → `Auto Scan`/`Unable to read the number plate. Please try again.`; network (`status 0`) → `OCR Failed`/`Unable to reach the OCR service. Check that your phone and server (192.168.1.144:8082) are on the same network.`; other → `OCR Failed`/`Some error occurred. Please try again later.`; camera permission code 20 → `Camera Permission Required`/`Please allow Camera access for Lambert Parking in Settings > Apps > Lambert Parking > Permissions, then try Auto Scan again.`
- `printer.png` → requires entry response `status=="success"` (else `First enter a vehicle`) → ESC/POS receipt → printer selection flow (§10).
- `gate.png` → reads `EnableBoomGate`: `YES` → BT enabled? + `DeviceConnected=='true'` → write `'E'` → toast `OPEN` → (then sets DeviceConnected back to `false` and disconnects); `NO` → nothing; `Nil`/missing → alert `Activated Boom Gate?` (`Yes`/`No` → store `YES`/`NO`). Missing BT → alerts `Bluetooth not connected` / `Please Enable Bluetooth and connect` (button `Ok`) → open BluetoothModal.

### 8.4 Exit
- Header + FAB `Gate Open` (70px, bottom-right) → same gate logic as Entry.
- Title `{startLocation} To {endLocation}`. Search `Search with vehicle number` (case-insensitive filter).
- Vehicle cards: `Licon.png` avatar, `{vehicle_number}` UPPERCASE, `Vehicle Type / Mobile / Start Time / Type` rows, buttons `Exit` (navy) and (only `type == 'Normal'`) `Exempted ?` (orange).
- List: `POST vendor_parkedvehicle_list` (`parking_id`) — empty → alert `Parking`/`No vehicle available`.
- `Exit` → `POST calculate_fare` (`allotment_id`, `time` now) → on success open ExitModal with fare/gst/token/hourdiff/etc. (blank gst → `''`, blank token → `NA`); non-success → **silent no-op** (quirk).
- `Exempted ?` → calculate fare (validate) → confirm alert `Exempted Vehicle` (HTML title with underline) `Cancel`/`Confirm` → `parking_exit` with `fare='0'`, `coupon=''`, `exempted='1'` → then exit-confirm with buttons `Cancel` / `Exit` / `Exit & Print`.
- Gate/FAB behavior as Entry.

### 8.5 ExitModal
- Title `<u>Parking Charges</u>`. Read-only rows: `Base Fare: ₹`, `GST Percentage (%):`, `GST Amount (₹):`, `Total Fare: ₹`, `Vehicle Type:`, `Total Time:`, `Token no.:`.
- Inputs: `Coupon Code` (number), `Amount` (number, prefilled with fare).
- `Cancel` (red) / `Confirm`.
- Confirm validation: empty amount → `Parking Exit`/`Please enter amount`; amount > server fare → `Parking Exit`/`Entered amount cannot be greater than total fare`.
- Then confirm alert `Parking`/`Exit the vehicle ?` → `Cancel` / `Exit` / `Exit & Print`.
- `POST parking_exit` (`allotment_id`, `fare`, `exempted=''`, `coupon=''` ← quirk: coupon input never copied, `time` fresh) → success alert `Parking Exit`/`response.msg` → dismiss (Exit) or print receipt first (Exit & Print) → dismiss after print.

### 8.6 BluetoothModal
- Title `Bluetooth Modal`. Buttons with icons: `Refresh Bluetooth Devices`, `Connect Bluetooth Devices` (after list), `Back`.
- Lists **paired devices only** (no discovery), radio selection by index, connect → toasts `Successfully Connected` (then subscribes `'\n'` → `Connected Successfullly`), errors `Error:Connecting to Device`, `Please Enable Bluetooth`, `Select Paired Device to connect`, `Device Disconnected`.
- Persists `DeviceConnected` = `"true"` on success, `"false"` on failure/disconnect; `Back` sets `"notSet"` if never connected successfully.
- No MAC persistence. Commented-out `Open Gate`/`Close Gate` buttons (do not add).

---

## 9. CITIZEN/GUEST FLOW — behavior spec (beyond Map)

- **CitizenLogin:** heading `Citizen Login`, fields `Mobile Number`/`Password`, links `Don't have an account? Sign Up.` + `Forgot password?`, button `Log In`. Validation: `Please enter mobile number` → `Mobile number must be 10 digit` → `Please enter password`. Success → store keys (§4) + setRoot Map. Fail → `Parking`/`response.error`. Loader `Loading...` spinner `ios`.
- **AttendantLogin:** heading `Attendant Login`, `Forgot password?`, `Log In`. Validation: `Please enter mobile number` → `Please enter password` (no 10-digit check). Success → store keys + **push ParkingZone**. Fail → `Parking`/`No user found`. Transport → `Login failed` / `Unable to reach the login service (HTTP {status}). Check the server address and network connection.` Loader `Please wait...` spinner `circles` orange.
- **ForgotPassword (citizen/attendant):** heading `Citizen Forgot Password` / `Attendant Forgot Password`, field `Mobile Number`, button `Submit`. Success → alert `Parking`/`response.message` → OK → setRoot respective login.
- **CustomerRegistration:** header `New Profile`, heading `Sign Up`, floating labels `Name`, `Address`, `Contact Number`, `Email Id`, `Password` (note: password field is `type="email"` — unmasked; preserve behavior), checkbox `I agree to Lambert Parking Terms & Conditions` (link opens IAB), button `Sign Up` disabled until checked. Validation order: name → address → mobile → 10-digit → email → password. Success → `Parking`/`Registration successful!` → OK → **push** CitizenLogin. Fail → `Error`/`response.error`.
- **ChangePassword:** heading `Change Password`, fields `Old password`/`New password`/`Confirm password`, button `Submit`. Client-side checks incl. old password compared to stored plaintext `password` (messages verbatim, incl. `THis is not your old password!...`), `Your password and confirm password do not match.`. API sends only phone+new. Success → alert `Parking`/`message` → setRoot Map. **Stored password is NOT updated** (quirk).
- **CitizenParkingHistory:** heading `History`, field `Mobile Number`, button `Done` (`#1185cf`), cards with `history.png` + rows `Vehicle Type / Mobile / Location / Entry Time / Exit Time / Fare`, header = vehicle_number. Errors: `Parking`/`Mobile number should be 10 digits`, `Please enter mobile number`, or server `error`.
- **Coupons:** title `Coupons`, empty messages `No vendors found.` / `No coupons available.`; loads `parkingspace_list` → unique vendor_ids → `advance_booking_token` per vendor → cards: `token_no` (navy 18px bold), orange route chip `{start} To {end}`, `Address: {location}`.
- **CustomerDeregistration:** `Are you sure you want to de-register yourself?` + `Yes`/`No`. `POST deregister_citizen` (`citizen_id` from storage) → success alert `Parking`/`message` → setRoot Landing; No/back → Map.
- **Logout:** title `Logout`, `Are you sure you want to log out now?` + `Yes`/`No` (exact clear sequence per §4.1).
- **Support:** heading `Support` only (decorative).
- **TermsNConditions:** heading wrongly says `Contact Us`, button `Click here to view Terms & Conditions.` → IAB.
- **ContactUs / BookingHistory / NewProfile / AttendantChangePassword:** unreachable/empty — implement but do not wire new navigation.
- **Menu Contact Us / Terms & Conditions:** `setRoot(Map)` + open InAppBrowser with URL fetched at app start (`get_lambert_address` / `get_terms_n_cond`), options `{zoom:'no', mediaPlaybackRequiresUserAction:'no', closebuttoncaption:'Done'}`.

---

## 10. BLUETOOTH / PRINTER / ESC-POS

- `PrinterProvider` = thin wrapper: `enableBluetooth()` → `bluetoothSerial.enable()`; `searchBluetooth()` → `list()` (paired only); `connectBluetooth(addr)`; `printData(bytes)` → `write()`; `disconnectBluetooth()`.
- Receipt encoding: `esc-pos-encoder-ionic` `EscPosEncoder`:
  `initialize()` → `codepage('cp936')` → `align('center')` → `bold(true)` → `line(agencyName)` → `line('==== ENTRY ====')` | `'==== EXIT ===='` → `.raw(TXT_NORMAL)` → `.line('********************************')` → `align('left')` → bold labels / normal values:
  - Entry: `# Parking Location`, `# Vehicle Number`, `# Vehicle Type`, `# Entry Time`, `# Booking Type`, `# Token No.`
  - Exit adds: `# Exit Time`, `# Total Duration`, `# Total Fare` (after Entry Time)
  - then `newline` → `align('center')` → `bold(true)` → `line('== THANK YOU ==')` → `newline().newline()` → `encode()`.
- Print UX: loading `Printing...` → alert `Select your printer` with **radio inputs per paired device (value = MAC, label = name)**, buttons `Cancel` / `Select printer` → connect → write → alert `Successful print!` (`Ok` → disconnect [+ dismiss modal on exit flow]); errors: `There was an error printing, please try again!`, `There was an error connecting to the printer, please try again!`, `There was an error connecting the printer, please try again!`, `Error activating bluetooth, please try again!`, `Select a printer!`, `There was an error connecting the printer, please try again!`.
- `printer-commands.ts` (ESC/POS byte tables) must be ported verbatim (pure data).
- Gate command: `bluetoothSerial.write('E')` → toast `OPEN` + toast of raw success string.

---

## 11. ASSETS, FONTS, SPLASH, ICONS

### 11.1 Copy verbatim into RN project

`src/assets/imgs/` (15): `Licon.png` (1024²), `arrow1.png`, `arrow2.png`, `backgroundImage.png` (1280², 2.3MB — landing/registration bg), `car.png`, `check1.png`, `check2.png`, `curLoc.png`, `greenMapPin.png`, `history.png`, `menu-three-horizontal-lines-symbol.png`, `parking-marker-active.svg`, `parking-marker-full.svg`, `power.png`, `redMapPin.png`.

`src/assets/icon/` (16): menu icons `Booking-History.png`, `Contact-Us.png`, `Coupons.png`, `De-registration.png`, `Logout.png`, `Password.png`, `Suport.png`, `Terms.png`, `exit.png`, `home.png` (all 27×27, rendered 32×32) + `back.png` (512²), `gate.png` (738×867), `printer.png` (738×866), `mylocation.png` (32²), `nav-bar.png` (46×32, hamburger), `favicon.ico`.

`resources/`: `icon.png` (1024²), `splash.png` (2732²) masters + density icon/splash sets for Android & iOS → generate RN app icons/splash from these exact files.

Marker SVGs must be converted to PNG (36×44 @1x/2x/3x) for map markers — same artwork: teardrop pin `#1565C0` (active) / `#C62828` (full), white rounded square, bold `P`.

### 11.2 Fonts

- **No custom @font-face.** Stack: `Roboto` + `Noto Sans` (Ionic defaults) + `Ionicons` glyphs.
- `html { font-size: 62.5% }` → **1rem = 10px** (so `4rem` = 40px CTAs).
- RN: use system font (Roboto on Android / San Francisco on iOS) with explicit `fontWeight` per design tokens; load **Ionicons-equivalent only where the original uses ionicons glyphs** (`bluetooth`, `refresh`, `send` in BluetoothModal; `navbar` replaced by `nav-bar.png` PNG). No Font Awesome is actually used despite the CDN link.

### 11.3 Splash & icon

- Existing artwork: `resources/splash.png` 2732² and full density sets; config: delay **3000 ms**, fade 300 ms, **no spinner**, no auto-hide (JS hides), aspect-ratio maintained, portrait.
- RN: use the existing splash PNG (boot splash) visible ~3 s / until ready; app icon from `resources/icon.png` (no new design).

---

## 12. DESIGN TOKENS (visual parity reference)

**Palette**

| Token | Hex | Use |
|---|---|---|
| primary | `#488aff` | links, `For Guest` button, alert button text |
| ktm (brand orange) | `#ff970b` | primary CTAs, InfoWindow title bar, loading text `#FF970B`, History chip, coupon route |
| yamaha (navy) | `#034083` | `For Attendant` button, Done/Exit buttons, coupon token, InfoWindow vehicle type |
| danger | `#f53d3d` | Cancel buttons |
| link blue | `#488aff` | `Sign Up.` / `Forgot password?` spans |
| toolbar bg | `#ffffff` | headers (border `#b2b2b2` MD / hairline iOS) |
| input border | `#ccc`, underline `#dedede` | pill inputs / list items |
| red text | `#c0392b` | empty-state messages |
| marker blue/red | `#1565C0` / `#C62828` | parking markers |
| FAB blue | `#427feb` | map current-location circle |
| btn-dark | `#1185cf` | history Done button |
| view-plan blue | `#6495ED` (cornflowerblue) | View Plan button |
| booking states | `#6c757d` / `#28a745` / `#dc3545` | Checking / Available / Full |
| map search pill | white + Material 3-layer shadow | search bar |

**Key component specs**

- Primary button: full-width, **height 40px** (`4rem`), `border-radius 64px` (pill), color white, uppercase (Ionic default), Material elevation shadow `0 2px 2px rgba(0,0,0,.14), 0 3px 1px -2px rgba(0,0,0,.2), 0 1px 5px rgba(0,0,0,.12)`.
- Text input (`.form-control`): height 40px, `border-radius 64px`, `1px solid #ccc`, transparent bg, margin `20px 0`, inner padding `11px`.
- Login headings: `h3`, black, `margin-top: 50px`, centered; `margin-bottom: 20%` gap under heading.
- Cards: white, radius `8px` (page cards `2px` default), margin `10px 12px`, elevation shadow.
- Loading (`custom-loading-css`): text color `#FF970B`, spinner `circles`, content `Please wait...`, auto-dismiss 50 s.
- Alerts: stock Ionic MD — max-width 280px, bg `#fafafa`, radius 2px, title 22px, buttons uppercase right-aligned `#488aff`; backdrop not dismissible for `AlertCustom`.
- Header: white, centered title (iOS 17px/600, MD 20px/500 `#424242`), hamburger = `nav-bar.png` 32×32 (opacity .9), power icon 30×30 on ParkingZone.
- Landing: `backgroundImage.png` cover/center/no-repeat; 3 fixed-bottom pill buttons at `bottom: 9%`, width 91%, height 40px, margin-top 30px: orange / navy / primary-blue.
- Ad slides: image height 150px full width.

---

## 13. SUPPORT UTILITIES (→ RN equivalents)

| Ionic | Behavior | RN |
|---|---|---|
| `AlertCustom.showAlert(title, msg)` | backdrop-locked, single `OK` | shared alert component/helper with identical look |
| `AlertCustom.showToast(msg, 3000)` | (declared, unused) | n/a |
| per-page `showAlert(title,msg,['OK'])` | standard alert | same helper |
| confirm pattern | `Cancel` + `Yes`/custom buttons | same |
| `ActivityLoader` | `Please wait...`, circles, orange, 50 s, dismiss-on-nav | shared loading overlay |
| per-page loader | `Loading...`, ios spinner | shared loading overlay |
| `Printing...` loader | ad hoc | same overlay |
| page `showToast(msj)` | 1000 ms (BT/gate) | ToastAndroid / RN Toast |
| page `showError(e)` | alert `Error` + `Dismiss` | alert helper |
| `HttpLoggingInterceptor` | `[HTTP] ->/<-` logs | dev-only fetch/XHR logger |

---

## 14. BUSINESS-LOGIC DEPENDENCIES & QUIRKS CHECKLIST

Preserve (do not "fix") unless technically impossible — parity first:

1. Exit-confirm alert text `Confirm Exit` / `Do you want Exit?` (never a double-back toast).
2. GPS alert firing on every map build (`Lambert PArking` typo).
3. `attendent_forgot_password` server spelling; `sucessfull` booking match; terms `"Success"` capital S.
4. Client-side old-password check against plaintext stored password; password not updated after change.
5. Registration success **pushes** CitizenLogin (stack grows); back = setRoot.
6. Exit modal sends empty `coupon`/`exempted`; entry success does not pop the stack.
7. Menu `Booking History` → CitizenParkingHistory; `Contact Us`/`Terms & Conditions` → setRoot(Map) + InAppBrowser.
8. Attendant menu never usable; ParkingZone has no back button (only exit-confirm).
9. Guest menu has `Exit` → Landing; guests have no `citizen_id`.
10. `DeviceConnected` forced to `"false"` on app pause.
11. Gate flow writes `'E'` then immediately marks disconnected + disconnects (comment in code says remove later — keep behavior).
12. Loader dismissals often immediate (spinner effectively invisible) — user-visible parity = short/no spinner.
13. Orphan screens exist but are unreachable — reachable set must match.
14. Cleartext HTTP to `182.73.216.94` must keep working.
15. Camera permission error text references `Settings > Apps > Lambert Parking > Permissions`.

---

## 15. PHASE PLAN (remaining)

- **Phase 2 — Foundation:** RN TypeScript project in `react native/`, theme tokens (§12), asset copy + icon/splash generation (§11), storage layer with exact keys (§4), API layer with exact endpoints/FormData/tolerant parsing (§3), shared alert/loading/toast (§13), navigation stacks + drawer + back-button dispatcher (§2).
- **Phase 3 — Auth:** Landing, AttendantLogin, CitizenLogin, ForgotPassword (×2), CustomerRegistration, Logout (+ session/root decision).
- **Phase 4 — Attendant:** ParkingZone, ViewPlanModal, Entry (+camera OCR), Exit, ExitModal, BluetoothModal, printer/ESC-POS/gate.
- **Phase 5 — Citizen/Guest:** Map + booking + history/coupons/profile/password/deregistration/support/terms/contact/logout.
- **Phase 6 — Native validation:** maps, GPS, Places, markers/callouts, camera→OCR, Bluetooth/printer, storage, IAB, splash/icon.
- **Phase 7 — QA:** Android (back button, permissions, sizes) & iOS (safe areas, permissions, nav), `MIGRATION_CHECKLIST.md`.

**Verification loop after each screen:** build → tsc lint → runtime check → compare UI vs Ionic (layout/spacing/colors/text) → verify API payload names → verify navigation/back → fix → next.

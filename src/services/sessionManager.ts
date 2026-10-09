import {
  AdvanceBookingResponseModel,
  AdvanceBookingTokenResponseModel,
  AdvertisementResponseModel,
  AttendantForgotPasswordResponseModel,
  ChangePasswordModel,
  CheckAdvanceBookingResponseModel,
  CitizenChangePasswordResponseModel,
  CitizenDeRegistrationModel,
  CitizenDeRegistrationResponseModel,
  CitizenForgotPasswordResponseModel,
  CitizenLoginModel,
  CitizenLoginResponseModel,
  CitizenSignupModel,
  CitizenSignupResponseModel,
  ContactUsResponseModel,
  EntryModel,
  EntryResponseModel,
  ExitModel,
  ExitResponseModel,
  FareModel,
  FareResponseModel,
  LoginModel,
  LoginResponseModel,
  MapAreaResponseModel,
  OCRMobileResponseModel,
  OCRModelResponse,
  ParkedVehicleList,
  ParkedVehicleResponseModel,
  ParkingHistoryResponseModel,
  ParkingZoneResponseModel,
  TermsAndConditionsResponseModel,
  ValidateUserResponseModel,
  VehicleListModel,
  ViewPlanModel,
} from '../models';

export interface HttpError {
  status: number;
  message: string;
}

const logRequest = (method: string, url: string) => {
  console.log(`[HTTP] -> ${method} ${url}`);
};

const logResponse = (status: number, url: string, startedAt: number, body: any) => {
  console.log(`[HTTP] <- ${status} ${url} (${Date.now() - startedAt} ms)`);
  console.log('[HTTP] response:', body);
};

const logError = (status: number, url: string, startedAt: number, message: string) => {
  console.error(`[HTTP] xx ${status} ${url} (${Date.now() - startedAt} ms)`, message);
};

const toError = (status: number, message: string): HttpError => ({ status, message });

export const parseWebserviceJson = <T>(text: string, fallback: T): T => {
  let jsonStart = text.lastIndexOf('{"message"');
  if (jsonStart < 0) {
    jsonStart = text.indexOf('{');
    if (jsonStart < 0) {
      return fallback;
    }
  }
  try {
    return JSON.parse(text.substring(jsonStart)) as T;
  } catch {
    return fallback;
  }
};

const buildForm = (fields: Record<string, any>): FormData => {
  const params = new FormData();
  Object.keys(fields).forEach(key => {
    const value = fields[key];
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    } else {
      params.append(key, '');
    }
  });
  return params;
};

const sendJson = async <T>(method: string, url: string, form?: FormData): Promise<T> => {
  logRequest(method, url);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method,
      body: form,
      headers: form ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    const body = await response.json();
    logResponse(response.status, url, startedAt, body);
    if (!response.ok) {
      throw toError(response.status, response.statusText);
    }
    return body as T;
  } catch (e: any) {
    const status = typeof e?.status === 'number' ? e.status : 0;
    if (status === 0) {
      logError(0, url, startedAt, e?.message ?? 'Network request failed');
    }
    throw e?.status !== undefined ? e : toError(0, e?.message ?? 'Network request failed');
  }
};

const sendText = async <T>(
  method: string,
  url: string,
  form: FormData,
  fallback: T,
): Promise<T> => {
  logRequest(method, url);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method,
      body: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const text = await response.text();
    const parsed = parseWebserviceJson<T>(text, fallback);
    logResponse(response.status, url, startedAt, parsed);
    if (!response.ok) {
      throw toError(response.status, response.statusText);
    }
    return parsed;
  } catch (e: any) {
    const status = typeof e?.status === 'number' ? e.status : 0;
    logError(status, url, startedAt, e?.message ?? 'Network request failed');
    throw e?.status !== undefined ? e : toError(0, e?.message ?? 'Network request failed');
  }
};

export const session = {
  getResponseLogin: (URL: string, body: LoginModel): Promise<LoginResponseModel> =>
    sendJson('POST', URL, buildForm({ phone: body.phone, password: body.password })),

  getCitizenSignup: (
    URL: string,
    body: CitizenSignupModel,
  ): Promise<CitizenSignupResponseModel> =>
    sendJson(
      'POST',
      URL,
      buildForm({
        name: body.name,
        address: body.address,
        mobile_no: body.mobile_no,
        email: body.email,
        password: body.password,
      }),
    ),

  getCitizenLogin: (URL: string, body: CitizenLoginModel): Promise<CitizenLoginResponseModel> =>
    sendJson('POST', URL, buildForm({ phone: body.phone, password: body.password })),

  postCitizenChangePassword: (
    URL: string,
    body: ChangePasswordModel,
  ): Promise<CitizenChangePasswordResponseModel> =>
    sendJson('POST', URL, buildForm({ phone: body.phone, password: body.password })),

  getCitizenForgotPassword: (
    URL: string,
    body: { phone?: string },
  ): Promise<CitizenForgotPasswordResponseModel> =>
    sendJson('POST', URL, buildForm({ phone: body.phone })),

  getCitizenAdList: (URL: string): Promise<AdvertisementResponseModel> => sendJson('GET', URL),

  getCitizenDeRegistration: (
    URL: string,
    body: CitizenDeRegistrationModel,
  ): Promise<CitizenDeRegistrationResponseModel> =>
    sendJson('POST', URL, buildForm({ citizen_id: body.citizen_id })),

  getContactUsDetails: (URL: string): Promise<ContactUsResponseModel> => sendJson('GET', URL),

  getTermsAndConditions: (URL: string): Promise<TermsAndConditionsResponseModel> =>
    sendJson('GET', URL),

  getAtendantForgotPassword: (
    URL: string,
    body: { phone?: string },
  ): Promise<AttendantForgotPasswordResponseModel> =>
    sendJson('POST', URL, buildForm({ phone: body.phone })),

  getValidateLoggedInUser: (URL: string): Promise<ValidateUserResponseModel> =>
    sendJson('GET', URL),

  getResponseParkingZones: (URL: string): Promise<ParkingZoneResponseModel> =>
    sendJson('GET', URL),

  getResponseVehicleType: (URL: string): Promise<VehicleListModel> => sendJson('GET', URL),

  getResponseViewPlan: (URL: string): Promise<ViewPlanModel> => sendJson('GET', URL),

  getResponseMapParkingSpace: (URL: string): Promise<MapAreaResponseModel> =>
    sendJson('GET', URL),

  checkAdvanceBookingRequest: (
    URL: string,
    body: { parking_id?: string; vt_id?: string; vendor_id?: string },
  ): Promise<CheckAdvanceBookingResponseModel> =>
    sendText(
      'POST',
      URL,
      buildForm({ parking_id: body.parking_id, vt_id: body.vt_id, vendor_id: body.vendor_id }),
      { status: 'fail', message: 'Invalid response', data: { free_slot: 0 } },
    ),

  advanceBookingRequest: (
    URL: string,
    body: {
      vendor_id?: string;
      citizen_id?: string;
      parking_id?: string;
      advance_id?: string;
      cars_no?: string;
    },
  ): Promise<AdvanceBookingResponseModel> =>
    sendText(
      'POST',
      URL,
      buildForm({
        vendor_id: body.vendor_id,
        citizen_id: body.citizen_id,
        parking_id: body.parking_id,
        advance_id: body.advance_id,
        cars_no: body.cars_no,
      }),
      { status: 'fail', message: 'Invalid response' },
    ),

  advanceBookingToken: (
    URL: string,
    body: { vendor_id?: string },
  ): Promise<AdvanceBookingTokenResponseModel> =>
    sendText('POST', URL, buildForm({ vendor_id: body.vendor_id }), {
      status: 'fail',
      message: 'Invalid response',
    }),

  getResponseParkingEntry: (
    URL: string,
    body: EntryModel,
  ): Promise<EntryResponseModel> =>
    sendJson(
      'POST',
      URL,
      buildForm({
        parking_id: body.parking_id,
        mobile: body.mobile,
        vehicle_number: body.vehicle_number,
        vehicle_type_id: body.vehicle_type_id,
        vendor_userid: body.vendor_userid,
        entry_time: body.entry_time,
        token_no: body.token_no,
      }),
    ),

  getParkedVehicleList: (URL: string, body: ParkedVehicleList): Promise<ParkedVehicleResponseModel> =>
    sendJson('POST', URL, buildForm({ parking_id: body.parking_id })),

  getExitVehicle: (URL: string, body: ExitModel): Promise<ExitResponseModel> =>
    sendJson(
      'POST',
      URL,
      buildForm({
        allotment_id: body.allotmentId,
        fare: body.fare,
        exempted: body.exempted,
        coupon: body.coupon,
        time: body.time,
      }),
    ),

  getTotalFare: (URL: string, body: FareModel): Promise<FareResponseModel> =>
    sendJson('POST', URL, buildForm({ allotment_id: body.allotmentId, time: body.time })),

  getCitizenParkingHistory: (URL: string): Promise<ParkingHistoryResponseModel> =>
    sendJson('GET', URL),

  getOCRMobile: (URL: string): Promise<OCRMobileResponseModel> => sendJson('GET', URL),

  scanCarImage: (URL: string, image: string): Promise<OCRModelResponse> => {
    const base64 = image.indexOf('base64,') >= 0 ? image.split('base64,')[1] : image;
    const form = new FormData();
    form.append('image', {
      uri: `data:image/jpeg;base64,${base64}`,
      type: 'image/jpeg',
      name: 'numberplate.jpg',
    } as any);
    console.log('Number Plate OCR request sent (multipart file upload)');
    return sendJson('POST', URL, form);
  },
};

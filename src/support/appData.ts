import { ApiConstant } from '../constants/api';
import { ContactUsResponseModel, TermsAndConditionsResponseModel } from '../models';
import { session } from '../services/sessionManager';

/**
 * Port of the fields fetched once in Ionic `app.component.ts`
 * (`contactDetails`, `termsDetail`) used by the side menu items.
 */
export const appData = {
  contactDetails: undefined as string | undefined,
  termsDetail: undefined as string | undefined,
};

export const fetchAppData = (): void => {
  session
    .getContactUsDetails(ApiConstant.MainApi + ApiConstant.LambertAddress)
    .then((res: ContactUsResponseModel) => {
      console.log('response data of contact details is::::' + JSON.stringify(res));
      if (res.status === 'success') {
        appData.contactDetails = res.message;
      } else {
        console.log('Error occurred::::' + res.status);
      }
    })
    .catch(error => console.error('Contact details request failed', error));

  session
    .getTermsAndConditions(ApiConstant.MainApi + ApiConstant.TermsAndConditions)
    .then((res: TermsAndConditionsResponseModel) => {
      console.log('response data is::::' + JSON.stringify(res));
      if (res.status === 'Success') {
        appData.termsDetail = res.message;
        console.log(appData.termsDetail);
      } else {
        console.log('Error occurred::::' + res.status);
      }
    })
    .catch(error => console.error('Terms request failed', error));
};

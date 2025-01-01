'use client';

import { FC, PropsWithChildren, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEN from '../i18n/locales/en/common.json';
import commonFR from '../i18n/locales/fr/common.json';

const I18nProvider: FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: {
            common: commonEN,
          },
          fr: {
            common: commonFR,
          },
        },
        lng: 'en',
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: {
          escapeValue: false,
        },
      })
      .catch(console.error);
  }, []);

  return <>{children}</>;
};

export default I18nProvider;

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '../styles/global.css';
import '@/styles/exchange.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { theme } from '@/config/theme';
import { Notifications } from '@mantine/notifications';
import { Navbar } from '../components/Layout/Navbar/Navbar';
import { Providers } from './providers';

export const metadata = {
  title: 'LevinSwap Interface',
  description: 'LevinSwap Interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <Notifications />
            <Navbar />
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}

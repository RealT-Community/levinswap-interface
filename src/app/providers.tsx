"use client";

import { MantineProvider } from "@mantine/core";
import { ReactNode } from "react";
import I18nProvider from "../providers/I18nProvider";
import Web3Provider from "../providers/Web3Provider";
import { TokenListsProvider } from "../providers/TokenListsProvider";
import { theme } from "../styles/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Web3Provider>
          <TokenListsProvider>
            {children}
          </TokenListsProvider>
        </Web3Provider>
      </MantineProvider>
    </I18nProvider>
  );
}

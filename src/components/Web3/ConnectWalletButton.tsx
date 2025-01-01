"use client";

import { Button } from "@/components/Button/Button";
import { useNativeBalance } from "@/hooks/useNativeBalance";
import { useWeb3 } from "@/hooks/useWeb3";
import { Group, Text } from "@mantine/core";
import { useState } from "react";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { WalletMenu } from "./WalletMenu";

interface ConnectWalletButtonProps {
  variant?: "gradient" | "subtle";
}

export function ConnectWalletButton({
  variant = "gradient",
}: ConnectWalletButtonProps) {
  const { active, account } = useWeb3();
  const { formattedBalance, symbol } = useNativeBalance();
  const [opened, setOpened] = useState(false);

  const formattedAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  if (!active || !account) {
    return (
      <>
        <Button variant={variant} onClick={() => setOpened(true)}>
          Connecter un portefeuille
        </Button>
        <ConnectWalletModal opened={opened} onClose={() => setOpened(false)} />
      </>
    );
  }

  return (
    <WalletMenu>
      <Button variant="subtle">
        <Group gap="xs" justify="center" wrap="nowrap">
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            {formattedBalance} {symbol}
          </Text>
          <Text size="sm" style={{ whiteSpace: "nowrap" }}>
            {formattedAddress}
          </Text>
        </Group>
      </Button>
    </WalletMenu>
  );
}

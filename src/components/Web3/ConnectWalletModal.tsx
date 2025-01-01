"use client";

import { useWeb3 } from "@/hooks/useWeb3";
import { Group, Modal, Stack, Text, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AvailableConnectors } from "@realtoken/realt-commons";
import { IconX } from "@tabler/icons-react";
import Image from "next/image";
import classes from "./ConnectWalletModal.module.css";

interface ConnectWalletModalProps {
  opened: boolean;
  onClose: () => void;
}

const WALLETS = [
  {
    type: AvailableConnectors.metamask,
    name: "MetaMask",
    icon: "/images/wallets/metamask.svg",
    description: "Connectez-vous avec votre extension MetaMask",
  },
  {
    type: AvailableConnectors.walletConnectV2,
    name: "WalletConnect",
    icon: "/images/wallets/walletconnect.svg",
    description: "Connectez-vous avec WalletConnect",
  },
] as const;

export function ConnectWalletModal({
  opened,
  onClose,
}: ConnectWalletModalProps) {
  const { connect, isInitialized } = useWeb3();

  const handleConnect = async (type: AvailableConnectors) => {
    if (!isInitialized) {
      notifications.show({
        color: "yellow",
        title: "Initialisation en cours",
        message:
          "Veuillez patienter pendant l'initialisation des connecteurs...",
        autoClose: 2000,
      });
      return;
    }

    try {
      await connect(type);
      onClose();
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      notifications.show({
        title: "Erreur de connexion",
        message:
          error.message || "Une erreur est survenue lors de la connexion",
        color: "red",
        icon: <IconX size={16} />,
      });
    }
  };

  if (!opened) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Connecter un portefeuille"
      centered
      withCloseButton
      closeButtonProps={{
        icon: <IconX size={18} />,
        className: classes.closeButton,
      }}
      classNames={{
        root: classes.root,
        content: classes.modal,
        header: classes.header,
        title: classes.title,
        overlay: classes.overlay,
        body: classes.content,
        close: classes.close,
      }}
      transitionProps={{
        transition: "fade",
        duration: 200,
      }}
      overlayProps={{
        opacity: 0.7,
        blur: 6,
        color: "#000",
      }}
      size="md"
    >
      <Stack gap="md">
        {WALLETS.map((wallet) => (
          <UnstyledButton
            key={wallet.type}
            onClick={() => handleConnect(wallet.type)}
            className={classes.walletButton}
            disabled={!isInitialized}
            style={
              !isInitialized
                ? { opacity: 0.5, cursor: "not-allowed" }
                : undefined
            }
          >
            <Group gap="md" align="center">
              <div className={classes.imageWrapper}>
                <Image
                  src={wallet.icon}
                  width={32}
                  height={32}
                  alt={wallet.name}
                />
              </div>
              <div>
                <Text size="sm" fw={500}>
                  {wallet.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {wallet.description}
                </Text>
              </div>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Modal>
  );
}

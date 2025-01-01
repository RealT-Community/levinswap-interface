'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { Menu, Text } from '@mantine/core';
import { IconCopy, IconExternalLink, IconLogout } from '@tabler/icons-react';
import { AvailableConnectors } from '@realtoken/realt-commons';
import Image from 'next/image';
import classes from './WalletMenu.module.css';
import { notifications } from '@mantine/notifications';
import { WALLET_ICONS, WALLET_NAMES } from '@/config/wallets';

interface WalletMenuProps {
  children: React.ReactNode;
}

export function WalletMenu({ children }: WalletMenuProps) {
  const { account, disconnect, walletType } = useWeb3();

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      notifications.show({
        title: 'Adresse copiée',
        message: 'L\'adresse a été copiée dans le presse-papier',
        color: 'green',
        withBorder: true,
        icon: <IconCopy size={18} />,
        className: classes.notification,
        styles: {
          root: {
            backgroundColor: '#161926',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px',
          },
          icon: {
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            color: '#48c78e',
          },
          title: {
            color: '#fff',
            fontWeight: 500,
            fontSize: '14px',
          },
          description: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '13px',
          },
          closeButton: {
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              backgroundColor: 'transparent',
            },
          },
        },
      });
    }
  };

  const handleViewOnExplorer = () => {
    if (account) {
      window.open(`https://gnosisscan.io/address/${account}`, '_blank');
    }
  };

  const walletIcon = walletType ? WALLET_ICONS[walletType] : undefined;
  const walletName = walletType ? WALLET_NAMES[walletType] : undefined;

  return (
    <Menu
      position="bottom-end"
      offset={0}
      shadow="md"
      width={220}
      zIndex={9999}
      classNames={{
        dropdown: classes.menu,
        item: classes.menuItem,
      }}
    >
      <Menu.Target>
        <div style={{ position: 'relative' }}>
          {children}
        </div>
      </Menu.Target>

      <Menu.Dropdown>
        <div className={classes.header}>
          {walletIcon && walletName && (
            <div className={classes.walletType}>
              <Image
                src={walletIcon}
                alt={walletName}
                width={20}
                height={20}
                className={classes.walletIcon}
              />
              <Text>{walletName}</Text>
            </div>
          )}
        </div>

        <Menu.Divider className={classes.divider} />

        <Menu.Item
          leftSection={<IconCopy size={16} />}
          onClick={handleCopyAddress}
        >
          Copie d'adresse
        </Menu.Item>

        <Menu.Item
          leftSection={<IconExternalLink size={16} />}
          onClick={handleViewOnExplorer}
        >
          Voir sur l'explorateur
        </Menu.Item>

        <Menu.Divider className={classes.divider} />

        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={disconnect}
          color="red"
        >
          Déconnexion
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

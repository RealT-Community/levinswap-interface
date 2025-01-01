'use client';

import { Container, Group, Image, Text } from '@mantine/core';
import classes from './Navbar.module.css';
import Link from 'next/link';
import { ConnectWalletButton } from '@/components/Web3/ConnectWalletButton';
import { OptionsMenu } from '../OptionsMenu/OptionsMenu';

export function Navbar() {
  return (
    <div className={classes.navbar}>
      <Container size="xl" py="md">
        <Group justify="space-between" h="100%">
          <Group>
            <Link href="/" className={classes.logo}>
              <Image
                src="/images/192x192_App_Icon.png"
                width={32}
                height={32}
                alt="LevinSwap Logo"
              />
            </Link>
            <Group ml="xl" gap="xl">
              <Link href="/swap" className={classes.link}>
                <Text>xDai</Text>
              </Link>
              <Link href="/pool" className={classes.link}>
                <Text>Farm</Text>
              </Link>
              <Link href="/farm" className={classes.link}>
                <Text>Stake</Text>
              </Link>
              <Link href="/stake" className={classes.link}>
                <Text>Levin</Text>
              </Link>
            </Group>
          </Group>

          <Group>
            <ConnectWalletButton />
            <OptionsMenu />
          </Group>
        </Group>
      </Container>
    </div>
  );
}

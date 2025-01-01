'use client';

import { Menu, Text, Select } from '@mantine/core';
import { IconInfoCircle, IconBrandDiscord, IconChartBar, IconCode, IconBook2, IconDotsVertical } from '@tabler/icons-react';
import classes from './OptionsMenu.module.css';
import { useLocale } from '@/hooks/useLocale';
import { useRouter, usePathname } from 'next/navigation';

export function OptionsMenu() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (value: string | null) => {
    if (value) {
      setLocale(value);
      // Au lieu de recharger la page, on utilise le router de Next.js
      // pour rafraîchir la page sans perdre l'état
      router.refresh();
    }
  };

  return (
    <Menu
      position="bottom-end"
      offset={4}
      shadow="md"
      width={220}
      zIndex={9999}
      classNames={{
        dropdown: classes.menu,
        item: classes.menuItem,
      }}
    >
      <Menu.Target>
        <button className={classes.button}>
          <IconDotsVertical size={20} />
        </button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconInfoCircle size={16} />}
          component="a"
          href="https://levinswap.org/about"
          target="_blank"
        >
          About
        </Menu.Item>

        <Menu.Item
          leftSection={<IconBook2 size={16} />}
          component="a"
          href="https://levinswap.org/wiki"
          target="_blank"
        >
          Wiki
        </Menu.Item>

        <Menu.Item
          leftSection={<IconCode size={16} />}
          component="a"
          href="https://github.com/levinswap"
          target="_blank"
        >
          Code
        </Menu.Item>

        <Menu.Item
          leftSection={<IconBrandDiscord size={16} />}
          component="a"
          href="https://discord.gg/levinswap"
          target="_blank"
        >
          Discord
        </Menu.Item>

        <Menu.Item
          leftSection={<IconChartBar size={16} />}
          component="a"
          href="https://info.levinswap.org"
          target="_blank"
        >
          Analytics
        </Menu.Item>

        <Menu.Divider className={classes.divider} />

        <Select
          size="sm"
          value={locale}
          onChange={handleLocaleChange}
          data={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          classNames={{
            root: classes.selectRoot,
            input: classes.selectInput,
            dropdown: classes.selectDropdown,
            option: classes.selectOption,
          }}
          styles={{
            input: {
              border: 'none',
              backgroundColor: 'transparent',
            },
          }}
        />
      </Menu.Dropdown>
    </Menu>
  );
}

import {
  ActionIcon,
  Button,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconX } from '@tabler/icons-react';
import { useCustomTokens } from '@/hooks/useCustomTokens';
import { useWeb3 } from '@/hooks/useWeb3';
import { rem } from '@mantine/core';

interface CustomTokenFormValues {
  address: string;
  logoUrl: string;
}

export function CustomTokens() {
  const { active, chainId, provider } = useWeb3();
  const { customTokens, addCustomToken, removeCustomToken, validateAddress, isReady } = useCustomTokens();

  const form = useForm<CustomTokenFormValues>({
    initialValues: {
      address: '',
      logoUrl: '',
    },
    validate: {
      address: (value) => (!validateAddress(value) ? 'Invalid address' : null),
      logoUrl: (value) => (value && !value.startsWith('http') ? 'Invalid URL' : null),
    },
  });

  const handleSubmit = async (values: CustomTokenFormValues) => {
    if (!isReady) {
      notifications.show({
        title: 'Error',
        message: 'Please connect your wallet first',
        color: 'red',
      });
      return;
    }

    const success = await addCustomToken(values.address, values.logoUrl || undefined);
    
    if (success) {
      notifications.show({
        title: 'Success',
        message: 'Token added successfully',
        color: 'green',
      });
      form.reset();
    } else {
      notifications.show({
        title: 'Error',
        message: 'Failed to add token. Please check the contract address and try again.',
        color: 'red',
      });
    }
  };

  const handleRemove = (address: string) => {
    removeCustomToken(address);
    notifications.show({
      title: 'Success',
      message: 'Token removed successfully',
      color: 'green',
    });
  };

  return (
    <Stack gap="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Token Address"
            placeholder="0x..."
            {...form.getInputProps('address')}
            styles={{
              input: {
                backgroundColor: 'var(--card-bg-light)',
                border: '1px solid var(--card-border)',
                color: 'white',
              },
              label: {
                color: 'var(--mantine-color-dimmed)',
              },
            }}
          />
          <TextInput
            label="Logo URL (optional)"
            placeholder="https://..."
            {...form.getInputProps('logoUrl')}
            styles={{
              input: {
                backgroundColor: 'var(--card-bg-light)',
                border: '1px solid var(--card-border)',
                color: 'white',
              },
              label: {
                color: 'var(--mantine-color-dimmed)',
              },
            }}
          />
          <Button
            type="submit"
            variant="filled"
            color="pink"
            disabled={!active}
            styles={{
              root: {
                backgroundColor: "#cab0c2",
                '&:hover': {
                  backgroundColor: "#b799ab",
                },
              },
            }}
          >
            {active ? 'Import Token' : 'Connect Wallet to Import'}
          </Button>
        </Stack>
      </form>

      <Text size="sm" fw={500} c="dimmed">
        {customTokens.length} Custom Tokens
      </Text>

      <Stack gap="xs">
        {customTokens.map((token) => (
          <UnstyledButton
            key={token.address}
            style={(theme) => ({
              width: "100%",
              padding: "12px",
              borderRadius: theme.radius.md,
              backgroundColor: "rgba(202, 176, 194, 0.1)",
              border: "1px solid #cab0c2",
            })}
          >
            <Group justify="space-between" align="center">
              <Group>
                <Image
                  src={token.logoURI}
                  alt={token.name}
                  width={32}
                  height={32}
                  radius="xl"
                  fallbackSrc="/images/default-token.png"
                />
                <div>
                  <Text size="sm" fw={500}>
                    {token.symbol}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {token.name}
                  </Text>
                </div>
              </Group>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => handleRemove(token.address)}
              >
                <IconTrash style={{ width: rem(16), height: rem(16) }} />
              </ActionIcon>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Stack>
  );
}

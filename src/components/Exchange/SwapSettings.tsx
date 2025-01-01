"use client";

import {
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAtom } from 'jotai';
import { swapSettingsAtom } from '../../store/swapSettings';

interface SwapSettingsProps {
  opened: boolean;
  onClose: () => void;
}

export function SwapSettings({ opened, onClose }: SwapSettingsProps) {
  const [settings, setSettings] = useAtom(swapSettingsAtom);

  const handleSlippageChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      slippageMode: value,
      slippageTolerance: parseFloat(value),
    }));
  };

  const handleCustomSlippageChange = (value: number | "") => {
    if (value !== "") {
      setSettings((prev) => ({
        ...prev,
        slippageMode: "custom",
        slippageTolerance: value,
      }));
    }
  };

  const handleDeadlineChange = (value: number | "") => {
    if (value !== "") {
      setSettings((prev) => ({
        ...prev,
        transactionDeadline: value,
      }));
    }
  };

  const handleExpertModeChange = (checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      expertMode: checked,
    }));
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Swap Settings"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      size="md"
    >
      <Stack gap="xl">
        <div style={{ marginTop: '1rem' }}>
          <Group justify="space-between" mb="md">
            <Text size="sm" fw={500}>
              Transaction Settings
            </Text>
          </Group>

          <Group justify="space-between" align="center" mb="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Slippage tolerance
              </Text>
              <Tooltip
                label="Your transaction will revert if the price changes unfavorably by more than this percentage."
                position="top"
                withArrow
                multiline
                w={220}
              >
                <IconInfoCircle
                  size={16}
                  style={{ color: "var(--mantine-color-dimmed)" }}
                />
              </Tooltip>
            </Group>
          </Group>

          <Group gap="xs" mb="lg">
            <SegmentedControl
              data={[
                { label: "0.1%", value: "0.1" },
                { label: "0.5%", value: "0.5" },
                { label: "1%", value: "1.0" },
              ]}
              value={settings.slippageMode === "custom" ? null : settings.slippageMode}
              onChange={handleSlippageChange}
              styles={(theme) => ({
                root: {
                  backgroundColor: "rgba(202, 176, 194, 0.1)",
                },
                control: {
                  border: "none",
                  "&[data-active]": {
                    backgroundColor: "#cab0c2 !important",
                  },
                },
                label: {
                  color: "white",
                  "&[data-active]": {
                    color: "#795d78 !important",
                    fontWeight: 700,
                  },
                },
                indicator: {
                  backgroundColor: "#cab0c2",
                },
              })}
            />
            <NumberInput
              value={settings.slippageTolerance}
              onChange={handleCustomSlippageChange}
              min={0}
              max={100}
              step={0.1}
              suffix="%"
              w={120}
              styles={{
                input: {
                  backgroundColor:
                    settings.slippageMode === "custom"
                      ? "rgba(202, 176, 194, 0.1)"
                      : "var(--card-bg-light)",
                  border: `1px solid ${
                    settings.slippageMode === "custom" ? "#cab0c2" : "var(--card-border)"
                  }`,
                  color: "white",
                  transition: "all 0.3s ease",
                },
                control: {
                  color: "white",
                  border: "none",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  },
                },
              }}
            />
          </Group>

          <Group justify="space-between" align="center" mb="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Transaction deadline
              </Text>
              <Tooltip
                label="Your transaction will revert if it is pending for more than this long."
                position="top"
                withArrow
                multiline
                w={220}
              >
                <IconInfoCircle
                  size={16}
                  style={{ color: "var(--mantine-color-dimmed)" }}
                />
              </Tooltip>
            </Group>
          </Group>

          <Group gap="xs">
            <NumberInput
              value={settings.transactionDeadline}
              onChange={handleDeadlineChange}
              min={1}
              max={4320}
              w={100}
              styles={{
                input: {
                  backgroundColor: "var(--card-bg-light)",
                  border: "1px solid var(--card-border)",
                  color: "white",
                },
                control: {
                  color: "white",
                  border: "none",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  },
                },
              }}
            />
            <Text size="sm" c="dimmed">
              minutes
            </Text>
          </Group>
        </div>

        <div>
          <Text size="sm" fw={500} mb="md">
            Interface Settings
          </Text>
          <Group justify="space-between">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Toggle Expert Mode
              </Text>
              <Tooltip
                label="Bypasses confirmation modals and allows high slippage trades. Use at your own risk."
                position="top"
                withArrow
                multiline
                w={220}
              >
                <IconInfoCircle
                  size={16}
                  style={{ color: "var(--mantine-color-dimmed)" }}
                />
              </Tooltip>
            </Group>
            <Switch
              checked={settings.expertMode}
              onChange={(event) => handleExpertModeChange(event.currentTarget.checked)}
              size="md"
              color="#cab0c2"
              onLabel="ON"
              offLabel="OFF"
            />
          </Group>
        </div>
      </Stack>
    </Modal>
  );
}

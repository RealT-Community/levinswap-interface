"use client";

import { CustomRoute } from "@/hooks/useAllPairs";
import { Token } from "@/store/tokenLists";
import { Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconArrowRight, IconInfoCircle } from "@tabler/icons-react";
import classes from "./SwapDetails.module.css";

interface SwapDetailsProps {
  fromToken?: Token;
  toToken?: Token;
  fromAmount: string;
  toAmount: string;
  route?: CustomRoute | null;
  priceImpact: string;
  liquidityProviderFee: string;
}

export function SwapDetails({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  route,
  priceImpact,
  liquidityProviderFee,
}: SwapDetailsProps) {
  if (!fromToken || !toToken || !route) return null;

  const minimumReceived = parseFloat(toAmount) * 0.99; // 1% slippage par défaut

  return (
    <Stack className={classes.container} gap="xs">
      <Group justify="space-between" className={classes.row}>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Minimum reçu
          </Text>
          <Tooltip label="Votre transaction échouera si le prix change défavorablement de plus que ce pourcentage">
            <IconInfoCircle size={16} className={classes.infoIcon} />
          </Tooltip>
        </Group>
        <Text size="sm">
          {minimumReceived.toFixed(6)} {toToken.symbol}
        </Text>
      </Group>

      <Group justify="space-between" className={classes.row}>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Impact sur le prix
          </Text>
          <Tooltip label="La différence entre le prix du marché et le prix estimé en raison de la taille de la transaction">
            <IconInfoCircle size={16} className={classes.infoIcon} />
          </Tooltip>
        </Group>
        <Text
          size="sm"
          className={parseFloat(priceImpact) > 1 ? classes.warning : ""}
        >
          {priceImpact}%
        </Text>
      </Group>

      <Group justify="space-between" className={classes.row}>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Frais de liquidité
          </Text>
          <Tooltip label="Une partie de chaque transaction est partagée avec les fournisseurs de liquidité">
            <IconInfoCircle size={16} className={classes.infoIcon} />
          </Tooltip>
        </Group>
        <Text size="sm">
          {liquidityProviderFee} {fromToken.symbol}
        </Text>
      </Group>

      <Stack gap="xs" className={classes.routeContainer}>
        <Text size="sm" c="dimmed">
          Route
        </Text>
        <Group gap="xs" className={classes.route}>
          {route.path.map((token, index) => (
            <Group key={token.address} gap="xs">
              <img
                src={token.logoURI}
                alt={token.symbol}
                className={classes.tokenIcon}
              />
              <Text size="sm">{token.symbol}</Text>
              {index < route.path.length - 1 && (
                <IconArrowRight size={16} className={classes.arrow} />
              )}
            </Group>
          ))}
        </Group>
      </Stack>
    </Stack>
  );
}

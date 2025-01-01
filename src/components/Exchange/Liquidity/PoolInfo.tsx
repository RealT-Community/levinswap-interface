"use client";

import { Token } from "@/store/tokenLists";
import { formatNumber, formatPercentage } from "@/utils/formatNumber";
import { Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import classes from "../LiquidityInterface.module.css";

interface PoolInfoProps {
  token0?: Token;
  token1?: Token;
  reserves?: {
    reserve0: string;
    reserve1: string;
  };
  userShare?: string;
}

export function PoolInfo({
  token0,
  token1,
  reserves,
  userShare,
}: PoolInfoProps) {
  if (!token0 || !token1) return null;

  const reserve0 = reserves?.reserve0 || "0";
  const reserve1 = reserves?.reserve1 || "0";

  return (
    <div className={classes.infoSection}>
      <Text className={classes.infoTitle} size="sm">
        Informations de la pool
      </Text>

      <div className={classes.infoItem}>
        <div className={classes.infoLabel}>
          <Text size="sm" c="dimmed">
            Réserve {token0.symbol}
          </Text>
          <Tooltip label="Montant total de tokens dans la pool">
            <IconInfoCircle size={14} className={classes.infoIcon} />
          </Tooltip>
        </div>
        <Text className={classes.infoValue}>
          {formatNumber(Number(reserve0))}
        </Text>
      </div>

      <div className={classes.infoItem}>
        <div className={classes.infoLabel}>
          <Text size="sm" c="dimmed">
            Réserve {token1.symbol}
          </Text>
          <Tooltip label="Montant total de tokens dans la pool">
            <IconInfoCircle size={14} className={classes.infoIcon} />
          </Tooltip>
        </div>
        <Text className={classes.infoValue}>
          {formatNumber(Number(reserve1))}
        </Text>
      </div>

      <div className={`${classes.infoItem} ${classes.fullWidth}`}>
        <div className={classes.infoLabel}>
          <Text size="sm" c="dimmed">
            Votre part de la pool
          </Text>
          <Tooltip label="Pourcentage de la pool que vous possédez">
            <IconInfoCircle size={14} className={classes.infoIcon} />
          </Tooltip>
        </div>
        <Text className={classes.infoValue}>
          {formatPercentage(userShare || "0")}%
        </Text>
      </div>
    </div>
  );
}

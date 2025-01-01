"use client";

import { Token } from "@/store/tokenLists";
import { formatPercentage } from "@/utils/formatNumber";
import { Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import BigNumber from "bignumber.js";
import classes from "../LiquidityInterface.module.css";

interface PriceInfoProps {
  token0?: Token;
  token1?: Token;
  amount0?: string;
  amount1?: string;
}

export function PriceInfo({
  token0,
  token1,
  amount0,
  amount1,
}: PriceInfoProps) {
  if (!token0 || !token1) return null;

  const amount0Num = new BigNumber(amount0 || "0");
  const amount1Num = new BigNumber(amount1 || "0");

  const price0Per1 =
    amount0Num.isZero() || amount1Num.isZero()
      ? "0.00"
      : formatPercentage(amount1Num.dividedBy(amount0Num).toNumber());
  const price1Per0 =
    amount0Num.isZero() || amount1Num.isZero()
      ? "0.00"
      : formatPercentage(amount0Num.dividedBy(amount1Num).toNumber());

  return (
    <div className={classes.infoSection}>
      <Text className={classes.infoTitle} size="sm">
        Prix et ratios
      </Text>

      <div className={classes.infoItem}>
        <div className={classes.infoLabel}>
          <Text size="sm" c="dimmed">
            {token0.symbol} par {token1.symbol}
          </Text>
          <Tooltip label="Prix d'un token par rapport à l'autre">
            <IconInfoCircle size={14} className={classes.infoIcon} />
          </Tooltip>
        </div>
        <Text className={classes.infoValue}>{price0Per1}</Text>
      </div>

      <div className={classes.infoItem}>
        <div className={classes.infoLabel}>
          <Text size="sm" c="dimmed">
            {token1.symbol} par {token0.symbol}
          </Text>
          <Tooltip label="Prix d'un token par rapport à l'autre">
            <IconInfoCircle size={14} className={classes.infoIcon} />
          </Tooltip>
        </div>
        <Text className={classes.infoValue}>{price1Per0}</Text>
      </div>

      <div className={`${classes.infoItem} ${classes.fullWidth}`}>
        <div className={classes.infoLabel}>
          <Text size="sm" c="dimmed">
            Part de la pool
          </Text>
          <Tooltip label="Votre contribution à la pool sera proportionnelle à ces montants">
            <IconInfoCircle size={14} className={classes.infoIcon} />
          </Tooltip>
        </div>
        <Text className={classes.infoValue}>
          {formatPercentage(amount0Num.toNumber())} {token0.symbol} +{" "}
          {formatPercentage(amount1Num.toNumber())} {token1.symbol}
        </Text>
      </div>
    </div>
  );
}

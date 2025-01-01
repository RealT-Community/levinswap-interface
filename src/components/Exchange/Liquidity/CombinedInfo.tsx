"use client";

import { Token } from "@/store/tokenLists";
import { formatNumber, formatPercentage } from "@/utils/formatNumber";
import { Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import classes from "../LiquidityInterface.module.css";

interface CombinedInfoProps {
  token0?: Token;
  token1?: Token;
  reserves?: {
    reserve0: string;
    reserve1: string;
  };
  userShare?: string;
  amount0?: string;
  amount1?: string;
  lpTokens?: string;
}

export function CombinedInfo({
  token0,
  token1,
  reserves,
  userShare,
  amount0,
  amount1,
  lpTokens,
}: CombinedInfoProps) {
  if (!token0 || !token1) return null;

  const reserve0 = reserves?.reserve0 || "0";
  const reserve1 = reserves?.reserve1 || "0";

  const amount0Num = new BigNumber(amount0 || "0");
  const amount1Num = new BigNumber(amount1 || "0");

  const formattedReserve0 = ethers.utils.formatUnits(reserve0, token0.decimals);
  const formattedReserve1 = ethers.utils.formatUnits(reserve1, token1.decimals);

  const userShareNum = new BigNumber(userShare || "0").dividedBy(100);
  const userDeposit0 = new BigNumber(formattedReserve0).multipliedBy(
    userShareNum
  );
  const userDeposit1 = new BigNumber(formattedReserve1).multipliedBy(
    userShareNum
  );

  const price0Per1 = (() => {
    if (
      reserves &&
      !new BigNumber(reserve0).isZero() &&
      !new BigNumber(reserve1).isZero()
    ) {
      return new BigNumber(formattedReserve1)
        .dividedBy(formattedReserve0)
        .toFixed(6);
    }
    return amount0Num.isZero() || amount1Num.isZero()
      ? "0.000000"
      : amount1Num.dividedBy(amount0Num).toFixed(6);
  })();

  const price1Per0 = (() => {
    if (
      reserves &&
      !new BigNumber(reserve0).isZero() &&
      !new BigNumber(reserve1).isZero()
    ) {
      return new BigNumber(formattedReserve0)
        .dividedBy(formattedReserve1)
        .toFixed(6);
    }
    return amount0Num.isZero() || amount1Num.isZero()
      ? "0.000000"
      : amount0Num.dividedBy(amount1Num).toFixed(6);
  })();

  return (
    <div className={classes.infoSection}>
      <Text className={classes.infoTitle}>
        Prix et ratios
        <Tooltip label="Informations sur les prix et les ratios">
          <IconInfoCircle size={14} className={classes.infoIcon} />
        </Tooltip>
      </Text>

      <div className={classes.infoItem}>
        <div className={classes.ratioItem}>
          <div className={classes.ratioLabel}>
            <Text component="span">
              {token0.symbol} par {token1.symbol}
            </Text>
            <Tooltip label="Prix d'un token par rapport à l'autre">
              <IconInfoCircle size={14} className={classes.infoIcon} />
            </Tooltip>
          </div>
          <Text className={classes.ratioValue}>{price0Per1}</Text>
        </div>
      </div>

      <div className={classes.infoItem}>
        <div className={classes.ratioItem}>
          <div className={classes.ratioLabel}>
            <Text component="span">
              {token1.symbol} par {token0.symbol}
            </Text>
            <Tooltip label="Prix d'un token par rapport à l'autre">
              <IconInfoCircle size={14} className={classes.infoIcon} />
            </Tooltip>
          </div>
          <Text className={classes.ratioValue}>{price1Per0}</Text>
        </div>
      </div>

      <Text className={classes.infoTitle}>
        Informations de la pool
        <Tooltip label="Détails sur la pool de liquidité">
          <IconInfoCircle size={14} className={classes.infoIcon} />
        </Tooltip>
      </Text>

      <div className={classes.infoItem}>
        <div className={classes.ratioItem}>
          <div className={classes.reserveHeader}>
            <Text component="span">Réserve {token0.symbol}</Text>
            <Tooltip label="Montant total de tokens dans la pool">
              <IconInfoCircle size={14} className={classes.infoIcon} />
            </Tooltip>
          </div>
          <div className={classes.reserveValues}>
            <div className={classes.reserveRow}>
              <Text component="span" c="dimmed" size="sm">
                Total:
              </Text>
              <Text className={classes.ratioValue} c="dimmed" size="sm">
                {formatNumber(Number(formattedReserve0))}
              </Text>
            </div>
            <div className={classes.reserveRow}>
              <Text component="span" size="sm">
                Mon dépôt:
              </Text>
              <Text className={classes.ratioValue}>
                {formatNumber(userDeposit0.toNumber())}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div className={classes.infoItem}>
        <div className={classes.ratioItem}>
          <div className={classes.reserveHeader}>
            <Text component="span">Réserve {token1.symbol}</Text>
            <Tooltip label="Montant total de tokens dans la pool">
              <IconInfoCircle size={14} className={classes.infoIcon} />
            </Tooltip>
          </div>
          <div className={classes.reserveValues}>
            <div className={classes.reserveRow}>
              <Text component="span" c="dimmed" size="sm">
                Total:
              </Text>
              <Text className={classes.ratioValue} c="dimmed" size="sm">
                {formatNumber(Number(formattedReserve1))}
              </Text>
            </div>
            <div className={classes.reserveRow}>
              <Text component="span" size="sm">
                Mon dépôt:
              </Text>
              <Text className={classes.ratioValue}>
                {formatNumber(userDeposit1.toNumber())}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div className={`${classes.infoItem} ${classes.fullWidth}`}>
        <div className={classes.ratioItem}>
          <div className={classes.ratioLabel}>
            <Text component="span">Part de la pool</Text>
            <Tooltip label="Pourcentage et montant de tokens LP que vous possédez">
              <IconInfoCircle size={14} className={classes.infoIcon} />
            </Tooltip>
          </div>
          <div className={classes.ratioValues}>
            <div className={classes.reserveRow}>
              <Text component="span">Pourcentage</Text>
              <Text className={classes.ratioValue}>
                {formatPercentage(userShare || "0")}%
              </Text>
            </div>
            <div className={classes.reserveRow}>
              <Text component="span">Tokens LP</Text>
              <Text className={classes.ratioValue}>
                {formatNumber(Number(lpTokens || "0"))} LP
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

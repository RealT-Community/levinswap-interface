"use client";

import { useWeb3Store } from "@/hooks/useWeb3Store";
import { Token } from "@/store/tokenLists";
import "@/styles/exchange.css";
import { ActionIcon, Card, Group, Tabs, Text } from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowsExchange,
  IconCoinOff,
  IconCoins,
  IconDroplet,
  IconSettings,
} from "@tabler/icons-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { ConnectWalletButton } from "../Web3/ConnectWalletButton";
import classes from "./ExchangeCard.module.css";
import { UserLiquidityPools } from "./Liquidity/UserLiquidityPools";
import { WithdrawInterface } from "./Liquidity/WithdrawInterface";
import { LiquidityInterface } from "./LiquidityInterface";
import { SwapInterface } from "./SwapInterface";
import { SwapSettings } from "./SwapSettings";

type ExchangeMode = "swap" | "liquidity";

export function ExchangeCard() {
  const [mode, setMode] = useState<ExchangeMode>("swap");
  const [liquidityMode, setLiquidityMode] = useState<"add" | "withdraw">("add");
  const [showSwap, setShowSwap] = useState(true);
  const [showLiquidity, setShowLiquidity] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [withdrawPercentage, setWithdrawPercentage] = useState(0);
  const [shouldLoadPools, setShouldLoadPools] = useState(false);
  const { isActive, provider } = useWeb3Store();

  useEffect(() => {
    // Si on est en mode retrait mais qu'il n'y a pas de provider, on revient en mode ajout
    if (liquidityMode === "withdraw" && !provider) {
      setLiquidityMode("add");
      setShouldLoadPools(false);
      setSelectedPool(undefined);
    }
  }, [provider, liquidityMode]);

  // États pour le retrait de liquidité
  const [selectedPool, setSelectedPool] = useState<
    | {
        token0: Token;
        token1: Token;
        reserves: {
          reserve0: string;
          reserve1: string;
        };
        userShare: string;
        lpTokens: string;
        lpToken: Token;
      }
    | undefined
  >(undefined);

  const handleModeChange = (newMode: ExchangeMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    // Réinitialiser le mode de liquidité lors du changement de mode
    setLiquidityMode("add");
    setShouldLoadPools(false);
    setSelectedPool(undefined);

    if (newMode === "swap") {
      setShowLiquidity(false);
      setShowSwap(true);
    } else {
      setShowSwap(false);
      setShowLiquidity(true);
    }
  };

  const handleLiquidityModeChange = (newMode: "add" | "withdraw") => {
    if (newMode === "withdraw" && !provider) {
      // Si on essaie de passer en mode retrait sans provider, on ne fait rien
      return;
    }
    setLiquidityMode(newMode);
    if (newMode === "withdraw") {
      // Forcer le chargement des pools uniquement lors du switch vers "withdraw"
      setShouldLoadPools(true);
    } else {
      setShouldLoadPools(false);
      setSelectedPool(undefined);
    }
  };

  const handleAnimationEnd = () => {
    if (mode === "swap") {
      setShowLiquidity(false);
    } else {
      setShowSwap(false);
    }
  };

  const handleWithdrawPercentageChange = (percentage: number) => {
    setWithdrawPercentage(percentage);
  };

  const handlePoolSelect = (
    token0: Token,
    token1: Token,
    reserves: { reserve0: string; reserve1: string },
    userShare: string,
    lpTokens: string,
    pairAddress: string
  ) => {
    setSelectedPool({
      token0,
      token1,
      reserves,
      userShare,
      lpTokens,
      lpToken: {
        chainId: token0.chainId,
        address: pairAddress,
        name: `${token0.symbol}-${token1.symbol} LP`,
        symbol: `${token0.symbol}-${token1.symbol}-LP`,
        decimals: 18,
        logoURI: "",
      },
    });
  };

  const handleBackToList = () => {
    // Simplement retourner à la liste sans recharger les pools
    setSelectedPool(undefined);
  };

  return (
    <div className={classes.container}>
      <Card radius="lg" className={classes.card}>
        <div
          className={clsx(classes.content, { [classes.blurred]: !isActive })}
        >
          <Group
            justify="space-between"
            align="center"
            mb="md"
            style={{ position: "relative" }}
          >
            <Tabs
              value={mode}
              onChange={(value) => handleModeChange(value as ExchangeMode)}
              variant="pills"
              className={classes.tabs}
              radius="xl"
              styles={{
                tab: {
                  transition: "all 0.3s ease",
                  "&[data-active]": {
                    backgroundColor: "#cab0c2",
                    boxShadow: "0 4px 12px rgba(202, 176, 194, 0.25)",
                    color: "#795d78 !important",
                  },
                },
              }}
            >
              <Tabs.List>
                <Tabs.Tab
                  value="swap"
                  leftSection={<IconArrowsExchange size={16} />}
                >
                  <Text size="sm" fw={500}>
                    Swap
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab
                  value="liquidity"
                  leftSection={<IconDroplet size={16} />}
                >
                  <Text size="sm" fw={500}>
                    Liquidity
                  </Text>
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>

            {mode === "liquidity" && (
              <div className={classes.headerActions}>
                <div className={classes.modeSwitch}>
                  <button
                    type="button"
                    className={clsx(classes.modeSwitchButton, {
                      [classes.active]: liquidityMode === "add",
                    })}
                    onClick={() => handleLiquidityModeChange("add")}
                    aria-pressed={liquidityMode === "add"}
                  >
                    <span className={classes.iconWrapper}>
                      <IconCoins size={14} />
                      Ajouter
                    </span>
                  </button>
                  <button
                    type="button"
                    className={clsx(classes.modeSwitchButton, {
                      [classes.active]: liquidityMode === "withdraw",
                    })}
                    onClick={() => handleLiquidityModeChange("withdraw")}
                    aria-pressed={liquidityMode === "withdraw"}
                  >
                    <span className={classes.iconWrapper}>
                      <IconCoinOff size={14} />
                      Retirer
                    </span>
                  </button>
                  <div
                    className={clsx(classes.modeSwitchSlider, {
                      [classes.withdraw]: liquidityMode === "withdraw",
                    })}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            <button
              className={classes.settingsButton}
              onClick={() => setSettingsOpened(true)}
            >
              <IconSettings
                size={20}
                style={{
                  color: "var(--mantine-color-white)",
                  transition: "all 0.3s ease",
                }}
              />
            </button>
          </Group>

          <div className={classes.interfaceContainer}>
            {(showSwap || mode === "liquidity") && (
              <div
                className={clsx(classes.interface, classes.swapInterface, {
                  [classes.active]: mode === "swap",
                })}
                onAnimationEnd={handleAnimationEnd}
              >
                <SwapInterface />
              </div>
            )}
            {(showLiquidity || mode === "swap") && (
              <div
                className={clsx(classes.interface, classes.liquidityInterface, {
                  [classes.active]: mode === "liquidity",
                })}
                onAnimationEnd={handleAnimationEnd}
              >
                {liquidityMode === "add" ? (
                  <LiquidityInterface mode="add" />
                ) : (
                  <div className={classes.withdrawContainer}>
                    {!selectedPool ? (
                      <UserLiquidityPools
                        onPoolSelect={handlePoolSelect}
                        shouldLoad={shouldLoadPools}
                      />
                    ) : (
                      <>
                        <Group justify="space-between" mb="md">
                          <Text size="sm" fw={500}>
                            {selectedPool.token0.symbol}/
                            {selectedPool.token1.symbol}
                          </Text>
                          <ActionIcon
                            variant="subtle"
                            onClick={handleBackToList}
                            title="Retour à la liste des pools"
                          >
                            <IconArrowLeft size={16} />
                          </ActionIcon>
                        </Group>
                        <WithdrawInterface
                          token0={selectedPool.token0}
                          token1={selectedPool.token1}
                          reserves={selectedPool.reserves}
                          userShare={selectedPool.userShare}
                          lpTokens={selectedPool.lpTokens}
                          lpToken={selectedPool.lpToken}
                          onPercentageChange={handleWithdrawPercentageChange}
                          pairAddress={selectedPool.lpToken.address}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!isActive && (
          <div className={classes.overlay}>
            <Text size="lg" fw={500} ta="center" mb="md" c="white">
              Connectez votre portefeuille pour accéder à LevinSwap
            </Text>
            <ConnectWalletButton />
          </div>
        )}
      </Card>

      <SwapSettings
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />
    </div>
  );
}

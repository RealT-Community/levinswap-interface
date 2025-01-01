import { useUserLiquidityPools } from "@/hooks/useUserLiquidityPools";
import { Token } from "@/store/tokenLists";
import { formatPercentage } from "@/utils/formatNumber";
import {
  ActionIcon,
  Group,
  Input,
  Loader,
  Progress,
  Text,
} from "@mantine/core";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import classes from "./UserLiquidityPools.module.css";

interface UserLiquidityPoolsProps {
  onPoolSelect: (
    token0: Token,
    token1: Token,
    reserves: { reserve0: string; reserve1: string },
    userShare: string,
    lpTokens: string,
    pairAddress: string
  ) => void;
  shouldLoad: boolean;
}

export function UserLiquidityPools({
  onPoolSelect,
  shouldLoad,
}: UserLiquidityPoolsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { pools, isLoading, refetch, progress } =
    useUserLiquidityPools(shouldLoad);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const poolsRef = useRef(pools);
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (pools.length > 0) {
      poolsRef.current = pools;
    }
  }, [pools]);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!showLoading && searchInputRef.current && pools.length > 0) {
      searchInputRef.current.focus();
    }
  }, [showLoading, pools.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredPools = pools.filter(
    (pool) =>
      pool.token0.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token1.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showLoading || (pools.length === 0 && poolsRef.current.length > 0)) {
    return (
      <div className={classes.loadingContainer}>
        <Loader size="lg" />
        <Text size="sm" c="dimmed" mt="md">
          Chargement des positions...
        </Text>
        {isLoading && (
          <>
            <Text size="xs" c="dimmed" mt="xs">
              {progress}% complété
            </Text>
            <Progress
              size="sm"
              radius="xl"
              value={progress}
              animated
              className={classes.loadingProgress}
              color={progress === 100 ? "green" : "blue"}
            />
          </>
        )}
      </div>
    );
  }

  if (!shouldLoad) {
    return null;
  }

  if (pools.length === 0) {
    return (
      <div className={classes.emptyContainer}>
        <Text size="sm" c="dimmed">
          Aucune position de liquidité trouvée
        </Text>
        <ActionIcon
          variant="light"
          size="lg"
          onClick={handleRefresh}
          loading={isRefreshing}
          mt="md"
        >
          <IconRefresh size={20} />
        </ActionIcon>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <Group justify="space-between" mb="md">
        <Input
          ref={searchInputRef}
          placeholder="Rechercher par symbole..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        <ActionIcon
          variant="light"
          size="lg"
          onClick={handleRefresh}
          loading={isRefreshing}
        >
          <IconRefresh size={20} />
        </ActionIcon>
      </Group>

      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          {pools.length} {pools.length > 1 ? "pools trouvées" : "pool trouvée"}
        </Text>
      </Group>

      <div className={classes.poolList}>
        {filteredPools.length > 0 ? (
          filteredPools.map((pool) => (
            <div
              key={pool.pairAddress}
              className={classes.poolCard}
              onClick={() =>
                onPoolSelect(
                  pool.token0,
                  pool.token1,
                  pool.reserves,
                  pool.userShare,
                  pool.lpTokens,
                  pool.pairAddress
                )
              }
            >
              <Group gap="xs">
                <img
                  src={pool.token0.logoURI}
                  alt={pool.token0.symbol}
                  width={24}
                  height={24}
                  className={classes.tokenIcon}
                />
                <img
                  src={pool.token1.logoURI}
                  alt={pool.token1.symbol}
                  width={24}
                  height={24}
                  className={classes.tokenIcon}
                />
                <div>
                  <Text size="sm" fw={500}>
                    {pool.token0.symbol}/{pool.token1.symbol}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Part de la pool: {formatPercentage(pool.userShare)}%
                  </Text>
                </div>
              </Group>
            </div>
          ))
        ) : (
          <Text size="sm" c="dimmed" ta="center">
            Aucun résultat pour "{searchQuery}"
          </Text>
        )}
      </div>
    </div>
  );
}

"use client";

import { Token } from "@/store/tokenLists";
import { handleImageError, useTokenImage } from "@/utils/getTokenImage";
import { loadTokenImages } from "@/utils/loadTokenImages";
import { Group, Stack, Text } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import classes from "./SwapRoute.module.css";

interface TokenImageProps {
  token: Token;
}

function TokenImage({ token }: TokenImageProps) {
  const imageUrl = useTokenImage(token);

  return (
    <div className={classes.tokenIcon}>
      <Image
        src={imageUrl}
        alt={token.symbol}
        width={24}
        height={24}
        onError={handleImageError}
        unoptimized
        data-token-address={token.address.toLowerCase()}
      />
    </div>
  );
}

export interface CustomRoute {
  path: Token[];
  pairs: any[];
  amountOut: string;
  amountIn?: string;
}

interface SwapRouteProps {
  route?: CustomRoute | null;
  loading?: boolean;
}

export function SwapRoute({ route, loading }: SwapRouteProps) {
  useEffect(() => {
    // Charger les images des tokens au montage du composant
    loadTokenImages().catch(console.error);
  }, []);

  if (!route?.path || route.path.length <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Stack gap="xs">
          <Text size="sm" c="dimmed" fw={500}>
            Route
          </Text>
          {loading ? (
            <div
              className={classes.loadingText}
              style={{ width: "200px", height: "32px" }}
            />
          ) : (
            <Group gap="xs" wrap="nowrap" className={classes.routeContainer}>
              {route.path.map((token, index) => (
                <Group key={token.address} gap={4} wrap="nowrap">
                  <div className={classes.tokenGroup}>
                    <TokenImage token={token} />
                    <Text size="sm" c="dimmed">
                      {token.symbol}
                    </Text>
                  </div>
                  {index < route.path.length - 1 && (
                    <IconArrowRight
                      size={16}
                      className={classes.arrow}
                      style={{ color: "var(--mantine-color-dimmed)" }}
                    />
                  )}
                </Group>
              ))}
            </Group>
          )}
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { NATIVE_TOKEN } from "@/config/constants";
import { TOKEN_LISTS } from "@/config/tokenLists.config";
import { useNativeBalance } from "@/hooks/useNativeBalance";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useTokenLists } from "@/hooks/useTokenLists";
import { useWeb3Store } from "@/hooks/useWeb3Store";
import { formatNumber } from "@/utils/formatNumber";
import {
  ActionIcon,
  Button,
  Group,
  Image,
  Modal,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconSearch, IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { Token } from "../../../store/tokenLists";
import { CustomTokens } from "./CustomTokens";
import { TokenListOptions } from "./TokenListOptions";

interface TokenSelectProps {
  value?: Token;
  onChange: (token: Token) => void;
  opened: boolean;
  onClose: () => void;
}

export function TokenSelect({
  value,
  onChange,
  opened,
  onClose,
}: TokenSelectProps) {
  const [manageOpened, { open: openManage, close: closeManage }] =
    useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"lists" | "tokens">("lists");
  const [listUrl, setListUrl] = useState("");
  const { lists, activeTokens, searchTokens, toggleList, addList, removeList } =
    useTokenLists();

  const { balances, loadingStates } = useTokenBalances(activeTokens, opened);
  const { isActive, chainId } = useWeb3Store();
  const { balance: nativeBalance, symbol: nativeSymbol } = useNativeBalance();

  const handleTokenSelect = (token: Token) => {
    console.info("Selected token:", token);
    onChange(token);
    onClose();
  };

  const handleAddList = async () => {
    if (!listUrl) return;

    const notificationId = "add-token-list";
    notifications.show({
      id: notificationId,
      loading: true,
      title: "Ajout de la liste",
      message: "Chargement de la liste de tokens...",
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const success = await addList(listUrl);

      if (success === true) {
        notifications.update({
          id: notificationId,
          color: "green",
          title: "Liste ajoutée",
          message: "La liste de tokens a été ajoutée avec succès",
          autoClose: 3000,
        });
        setListUrl("");
      } else {
        notifications.update({
          id: notificationId,
          color: "red",
          title: "Erreur",
          message: "Format de liste invalide ou URL inaccessible",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error adding token list:", error);
      notifications.update({
        id: notificationId,
        color: "red",
        title: "Erreur",
        message: "Impossible d'ajouter la liste de tokens",
        autoClose: 3000,
      });
    }
  };

  const filteredTokens = searchQuery ? searchTokens(searchQuery) : activeTokens;

  // Créer le token natif
  const nativeToken: Token = {
    address: NATIVE_TOKEN.NATIVE_ADDRESS,
    chainId: chainId || 100,
    decimals: NATIVE_TOKEN.DECIMALS,
    name: nativeSymbol,
    symbol: nativeSymbol,
    logoURI: `/images/native/${nativeSymbol.toLowerCase()}.png`,
  };

  // Dédupliquer les tokens en utilisant l'adresse comme clé unique
  const uniqueTokens = filteredTokens.reduce(
    (acc: { [key: string]: Token }, token) => {
      // Ignorer les tokens qui sont en fait le token natif (xDAI, etc.)
      if (
        token.symbol?.toLowerCase() === "xdai" ||
        token.address.toLowerCase() ===
          NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase() ||
        token.address.toLowerCase() ===
          "0x0000000000000000000000000000000000000000"
      ) {
        return acc;
      }

      const key = `${token.chainId}-${token.address.toLowerCase()}`;
      if (!acc[key]) {
        acc[key] = token;
      }
      return acc;
    },
    {}
  );

  // Ajouter le token natif au début
  const nativeKey = `${
    nativeToken.chainId
  }-${nativeToken.address.toLowerCase()}`;
  uniqueTokens[nativeKey] = nativeToken;

  // Convertir l'objet en tableau
  const allTokens = Object.values(uniqueTokens);

  // Trier les tokens : d'abord ceux avec un solde non nul, puis par symbole
  const sortedTokens = allTokens.sort((a, b) => {
    const addressA = a.address.toLowerCase();
    const addressB = b.address.toLowerCase();

    const balanceA =
      addressA === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
        ? Number(nativeBalance || 0)
        : Number(balances[addressA] || 0);
    const balanceB =
      addressB === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
        ? Number(nativeBalance || 0)
        : Number(balances[addressB] || 0);

    // Si les deux balances sont différentes, trier par balance décroissante
    if (balanceA !== balanceB) {
      return balanceB - balanceA;
    }

    // Si les deux balances sont égales (y compris 0), trier par symbole
    return a.symbol.localeCompare(b.symbol);
  });

  return (
    <>
      <Modal
        opened={opened && !manageOpened}
        onClose={onClose}
        title={
          <Stack gap={2}>
            <Text size="xl" fw={500}>
              Select a token
            </Text>
            <Text size="xs" c="dimmed">
              {sortedTokens.length} tokens disponibles
            </Text>
          </Stack>
        }
        centered
        size="md"
        styles={{
          header: {
            marginBottom: "1rem",
          },
          title: {
            width: "100%",
          },
        }}
      >
        <Stack gap="md">
          <TextInput
            placeholder="Search name or paste address"
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: "var(--card-bg-light)",
                border: "1px solid var(--card-border)",
                color: "white",
                "&::placeholder": {
                  color: "var(--mantine-color-dimmed)",
                },
              },
            }}
          />

          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Token Lists
            </Text>
            <ActionIcon onClick={openManage} variant="transparent" color="gray">
              <IconSettings size={16} />
            </ActionIcon>
          </Group>

          <ScrollArea.Autosize mah={400}>
            <Stack gap="xs">
              {sortedTokens.map((token) => (
                <UnstyledButton
                  key={`${token.chainId}-${token.address}`}
                  onClick={() => handleTokenSelect(token)}
                  style={(theme) => ({
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: theme.radius.sm,
                    backgroundColor: "var(--card-bg-light)",
                    border: "1px solid var(--card-border)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid #cab0c2",
                    },
                  })}
                >
                  <Group>
                    {token.logoURI && (
                      <Image
                        src={token.logoURI}
                        alt={token.symbol}
                        width={32}
                        height={32}
                        radius="xl"
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {token.symbol}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {token.name}
                      </Text>
                    </div>
                    {isActive ? (
                      token.address === NATIVE_TOKEN.NATIVE_ADDRESS ? (
                        <Text size="sm" c="dimmed">
                          {formatNumber(Number(nativeBalance || 0))}
                        </Text>
                      ) : loadingStates[token.address.toLowerCase()] ? (
                        <Skeleton height={18} width={60} />
                      ) : (
                        <Text size="sm" c="dimmed">
                          {formatNumber(
                            Number(balances[token.address.toLowerCase()] || 0)
                          )}
                        </Text>
                      )
                    ) : null}
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      </Modal>

      <Modal
        opened={manageOpened}
        onClose={() => {
          closeManage();
          if (!opened) onClose();
        }}
        title="Manage Lists"
        centered
        size="md"
        styles={{
          header: {
            marginBottom: "1.5rem",
          },
          title: {
            fontSize: "1.2rem",
            fontWeight: 500,
          },
        }}
      >
        <Stack gap="xl">
          <Group grow>
            <Button
              onClick={() => setActiveTab("lists")}
              variant="filled"
              color={activeTab === "lists" ? "pink" : "gray"}
              styles={{
                root: {
                  backgroundColor:
                    activeTab === "lists" ? "#cab0c2" : undefined,
                  "&:hover": {
                    backgroundColor:
                      activeTab === "lists" ? "#b799ab" : undefined,
                  },
                },
              }}
            >
              Lists
            </Button>
            <Button
              onClick={() => setActiveTab("tokens")}
              variant="filled"
              color={activeTab === "tokens" ? "pink" : "gray"}
              styles={{
                root: {
                  backgroundColor:
                    activeTab === "tokens" ? "#cab0c2" : undefined,
                  "&:hover": {
                    backgroundColor:
                      activeTab === "tokens" ? "#b799ab" : undefined,
                  },
                },
              }}
            >
              Tokens
            </Button>
          </Group>

          {activeTab === "lists" ? (
            <Stack gap="md">
              <Group>
                <TextInput
                  placeholder="https:// or ipfs:// or ENS name"
                  value={listUrl}
                  onChange={(e) => setListUrl(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      backgroundColor: "var(--card-bg-light)",
                      border: "1px solid var(--card-border)",
                      color: "white",
                    },
                  }}
                />
                <Button
                  onClick={handleAddList}
                  disabled={!listUrl}
                  variant="filled"
                  color="pink"
                  styles={{
                    root: {
                      backgroundColor: "#cab0c2",
                      "&:hover": {
                        backgroundColor: "#b799ab",
                      },
                    },
                  }}
                >
                  Add List
                </Button>
              </Group>

              <ScrollArea.Autosize mah={400}>
                <Stack gap="xs">
                  {lists.map((list) => {
                    const config = TOKEN_LISTS.find((l) => l.id === list.id);
                    return (
                      <UnstyledButton
                        key={list.id}
                        style={(theme) => ({
                          width: "100%",
                          padding: "12px",
                          borderRadius: theme.radius.md,
                          backgroundColor: list.active
                            ? "rgba(202, 176, 194, 0.1)"
                            : "transparent",
                          border: "1px solid",
                          borderColor: list.active ? "#cab0c2" : "transparent",
                        })}
                      >
                        <Group justify="space-between">
                          <Group>
                            {list.logoURI && (
                              <Image
                                src={list.logoURI}
                                alt={list.name}
                                width={32}
                                height={32}
                                radius="xl"
                              />
                            )}
                            <div>
                              <Text size="sm" fw={500}>
                                {list.name}
                              </Text>
                              <Group gap={4} align="center">
                                <Text size="xs" c="dimmed">
                                  {(list.tokens || []).length} tokens
                                </Text>
                                <TokenListOptions
                                  listUrl={
                                    config?.url ||
                                    (list.id.startsWith("custom-")
                                      ? Buffer.from(
                                          list.id.replace("custom-", ""),
                                          "base64"
                                        ).toString()
                                      : "")
                                  }
                                  listId={list.id}
                                  onRefresh={async () => {
                                    if (!config?.url) return undefined;
                                    const result = await addList(config.url);
                                    return result === true;
                                  }}
                                  onRemove={removeList}
                                />
                              </Group>
                            </div>
                          </Group>
                          <Text
                            size="sm"
                            c={list.active ? "pink" : "dimmed"}
                            style={{
                              cursor: list.readonly ? "default" : "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              !list.readonly &&
                                toggleList(list.id, !list.active);
                            }}
                          >
                            {list.active ? "Enabled" : "Disabled"}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={400}>
              <CustomTokens />
            </ScrollArea.Autosize>
          )}
        </Stack>
      </Modal>
    </>
  );
}

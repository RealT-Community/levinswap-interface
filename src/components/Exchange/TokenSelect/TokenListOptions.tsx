import { TOKEN_LISTS } from "@/config/tokenLists.config";
import { ActionIcon, Menu, rem, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDots,
  IconExternalLink,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface TokenList {
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  name: string;
  timestamp: string;
  tokens: any[];
}

interface TokenListOptionsProps {
  listUrl: string;
  listId: string;
  onRefresh: () => Promise<boolean | undefined>;
  onRemove: (id: string) => void;
}

export function TokenListOptions({
  listUrl,
  listId,
  onRefresh,
  onRemove,
}: TokenListOptionsProps) {
  const [version, setVersion] = useState<string>("");
  const isDefaultList = TOKEN_LISTS.some((config) => config.id === listId);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(listUrl);
        if (!response.ok) {
          console.error("Failed to fetch token list:", response.statusText);
          return;
        }

        const data: TokenList = await response.json();
        if (data.version) {
          setVersion(
            `v${data.version.major}.${data.version.minor}.${data.version.patch}`
          );
        }
      } catch (error) {
        console.error("Error fetching token list version:", error);
      }
    };

    if (listUrl) {
      fetchVersion();
    }
  }, [listUrl]);

  const handleViewList = () => {
    window.open(
      `https://tokenlists.org/token-list?url=${encodeURIComponent(listUrl)}`,
      "_blank"
    );
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const notificationId = "token-list-refresh";

    notifications.show({
      id: notificationId,
      loading: true,
      title: "Mise à jour de la liste",
      message: "Vérification des mises à jour...",
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const updated = await onRefresh();

      if (updated) {
        notifications.update({
          id: notificationId,
          color: "green",
          title: "Liste mise à jour",
          message: "La liste de tokens a été mise à jour avec succès",
          icon: <IconRefresh size="1rem" />,
          autoClose: 3000,
        });
      } else {
        notifications.update({
          id: notificationId,
          color: "blue",
          title: "Liste à jour",
          message: "La liste est déjà à jour",
          icon: <IconRefresh size="1rem" />,
          autoClose: 3000,
        });
      }
    } catch (error) {
      notifications.update({
        id: notificationId,
        color: "red",
        title: "Erreur",
        message: "Impossible de mettre à jour la liste",
        icon: <IconRefresh size="1rem" />,
        autoClose: 3000,
      });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(listId);
  };

  return (
    <Menu shadow="md" width={200} position="right-start" offset={4}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          size="xs"
          style={{
            color: "var(--mantine-color-dimmed)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconDots style={{ width: rem(12), height: rem(12) }} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
        {version && (
          <Menu.Label>
            <Text size="xs" c="dimmed">
              {version}
            </Text>
          </Menu.Label>
        )}
        <Menu.Item
          leftSection={
            <IconExternalLink style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={(e) => {
            e.stopPropagation();
            handleViewList();
          }}
        >
          Voir la liste
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconRefresh style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={handleRefresh}
        >
          Mettre à jour
        </Menu.Item>
        {!isDefaultList && (
          <Menu.Item
            leftSection={
              <IconTrash style={{ width: rem(14), height: rem(14) }} />
            }
            onClick={handleRemove}
            color="red"
          >
            Retirer la liste
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

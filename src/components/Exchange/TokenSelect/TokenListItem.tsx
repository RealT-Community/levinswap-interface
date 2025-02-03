import { useTokenLists } from "@/hooks/useTokenLists";
import { Group, Image, Switch, Text, UnstyledButton } from "@mantine/core";
import { TokenList } from "../../../store/tokenLists";
import { TokenListOptions } from "./TokenListOptions";

interface TokenListItemProps {
  list: TokenList;
  onToggle: (active: boolean) => void;
  readonly?: boolean;
  url?: string;
}

export function TokenListItem({
  list,
  onToggle,
  readonly,
  url,
}: TokenListItemProps) {
  const { addList } = useTokenLists();

  const handleRefresh = async () => {
    if (!url) return false;
    return addList(url);
  };

  return (
    <UnstyledButton
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
            <Text size="xs" c="dimmed">
              {list.tokens.length} tokens
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          {url && (
            <TokenListOptions
              listUrl={url}
              onRefresh={handleRefresh}
              listId={""}
              onRemove={function (id: string): void {
                throw new Error("Function not implemented.");
              }}
            />
          )}
          <Switch
            checked={list.active}
            onChange={(event) => onToggle(event.currentTarget.checked)}
            disabled={readonly}
            size="md"
            color="#cab0c2"
            onLabel="ON"
            offLabel="OFF"
          />
        </Group>
      </Group>
    </UnstyledButton>
  );
}

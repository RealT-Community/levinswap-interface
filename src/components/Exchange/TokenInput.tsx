"use client";

import { Token } from "@/store/tokenLists";
import { Button, Group, Text, TextInput, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import classes from "./TokenInput.module.css";
import { TokenSelect } from "./TokenSelect/TokenSelect";

interface TokenInputProps {
  label: string;
  value: string;
  balance: string | React.ReactNode;
  token?: Token;
  onChange?: (value: string) => void;
  onSelectToken?: (token: Token) => void;
  loading?: boolean;
  onMaxClick?: () => void;
  showMaxButton?: boolean;
}

export function TokenInput({
  label,
  value,
  balance,
  token,
  onChange,
  onSelectToken,
  loading,
  onMaxClick,
  showMaxButton = true,
}: TokenInputProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const handleTokenSelect = (selectedToken: Token) => {
    if (onSelectToken) {
      onSelectToken(selectedToken);
    }
    close();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    console.debug("TokenInput - handleInputChange:", {
      rawValue: value,
      currentValue: value,
      label,
      token: token?.symbol,
    });

    // Autoriser les nombres décimaux avec une validation plus permissive
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      // Si la valeur est vide, on envoie "0" au parent pour maintenir la compatibilité
      const newValue = value === "" ? "0" : value;
      console.debug("TokenInput - Valeur validée:", {
        newValue,
        label,
        token: token?.symbol,
      });
      onChange?.(newValue);
    }
  };

  // Ne plus formater la valeur, utiliser le placeholder à la place
  const displayValue = value === "0" ? "" : value;

  console.debug("TokenInput - Rendu:", {
    label,
    token: token?.symbol,
    inputValue: value,
    displayValue,
    loading,
  });

  return (
    <div className={classes.wrapper}>
      <Group justify="space-between" mb={8}>
        <Text size="sm" fw={500} c="white">
          {label}
        </Text>
        <Text size="sm" c="dimmed">
          {balance}
        </Text>
      </Group>

      <div className={classes.inputWrapper}>
        <div
          className={`${classes.textInputWrapper} ${
            loading ? classes.loadingInput : ""
          }`}
        >
          {showMaxButton && onMaxClick && (
            <Button
              variant="subtle"
              size="xs"
              className={classes.maxButton}
              onClick={onMaxClick}
            >
              Max
            </Button>
          )}
          <TextInput
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            placeholder="0.0"
            styles={{
              input: {
                border: "none",
                backgroundColor: "transparent",
                fontSize: "1.5rem",
                fontWeight: 500,
                width: "100%",
                textAlign: "right",
                paddingRight: "12px",
                paddingLeft: showMaxButton ? "60px" : "12px",
                "&:focus": {
                  border: "none",
                },
                "&::placeholder": {
                  color: "var(--mantine-color-dimmed)",
                },
              },
              wrapper: {
                flex: 1,
                position: "relative",
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </div>

        <UnstyledButton className={classes.tokenSelect} onClick={open}>
          <Group gap="xs" align="center" wrap="nowrap">
            {token && (
              <div className={classes.tokenImageWrapper}>
                <Image
                  src={token.logoURI}
                  width={24}
                  height={24}
                  alt={token.symbol}
                />
              </div>
            )}
            <Text size="sm" fw={500} c="white" style={{ whiteSpace: "nowrap" }}>
              {token?.symbol || "Select token"}
            </Text>
          </Group>
        </UnstyledButton>
      </div>

      <TokenSelect
        opened={opened}
        onClose={close}
        value={token}
        onChange={handleTokenSelect}
      />
    </div>
  );
}

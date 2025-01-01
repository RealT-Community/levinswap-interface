"use client";

import { Token } from "@/store/tokenLists";
import { Group, Text, TextInput, UnstyledButton } from "@mantine/core";
import Image from "next/image";
import classes from "./WithdrawTokenInput.module.css";

interface WithdrawTokenInputProps {
  label: string;
  value: string;
  token: Token;
  onChange?: (value: string) => void;
  loading?: boolean;
  onMaxClick?: () => void;
}

export function WithdrawTokenInput({
  label,
  value,
  token,
  onChange,
  loading,
  onMaxClick,
}: WithdrawTokenInputProps) {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    console.debug("WithdrawTokenInput - handleInputChange:", {
      rawValue: value,
      currentValue: displayValue,
      label,
      token: token.symbol,
    });

    // Autoriser les nombres décimaux avec une validation plus permissive
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      const newValue = value === "" ? "0" : value;
      console.debug("WithdrawTokenInput - Valeur validée:", {
        newValue,
        label,
        token: token.symbol,
      });
      onChange?.(newValue);
    }
  };

  // Ne formater la valeur que si elle est vide ou "0"
  const displayValue = value === "" || value === "0" ? "0.0" : value;

  return (
    <div className={classes.wrapper}>
      <div className={classes.inputWrapper}>
        <div
          className={`${classes.textInputWrapper} ${
            loading ? classes.loadingInput : ""
          }`}
        >
          <UnstyledButton className={classes.maxButton} onClick={onMaxClick}>
            Max
          </UnstyledButton>
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
                paddingRight: "0.5rem",
                paddingLeft: "60px",
                color: "var(--mantine-color-white)",
                "&:focus": {
                  border: "none",
                  outline: "none",
                },
                "&::placeholder": {
                  color: "var(--mantine-color-dark-2)",
                },
              },
              wrapper: {
                flex: 1,
              },
            }}
          />
        </div>

        <div className={classes.tokenInfo}>
          <Group gap="xs" justify="center">
            <div className={classes.tokenImageWrapper}>
              <Image
                src={token.logoURI}
                width={24}
                height={24}
                alt={token.symbol}
              />
            </div>
            <Text size="sm" fw={500} c="white">
              {token.symbol}
            </Text>
          </Group>
        </div>
      </div>
    </div>
  );
}

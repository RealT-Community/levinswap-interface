import { JSBI, Percent } from "@levinswap/uniswap-sdk";

// Frais de base de 0.3%
export const BASE_FEE = new Percent(JSBI.BigInt(30), JSBI.BigInt(10000));

// 100%
export const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000));

// 100% - 0.3% = 99.7%
export const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE);

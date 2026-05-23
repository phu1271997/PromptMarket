import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// Main contract address from environment
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xaCcF8997cFE554fC230026FCAeeD5D152dEc2c99") as `0x${string}`;

// Primary GenLayer Client
export const getGenLayerClient = (account?: `0x${string}`) => {
  return createClient({
    chain: studionet,
    endpoint: "https://studio.genlayer.com/api",
    account: account
  });
};

export const client = getGenLayerClient();

// Helper to convert wei string to standard representation (like tokens/wei)
export const formatWei = (wei: string | bigint): string => {
  const value = typeof wei === "string" ? BigInt(wei) : wei;
  // Express price in standard GenTokens (assuming 18 decimal places or 1:1 for basic studio representation)
  // For easy readability in studio, we can format as standard decimal
  const formatted = Number(value) / 1e18;
  return formatted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
};

// Convert standard input to Wei BigInt
export const parseToWei = (amount: number | string): bigint => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.floor(num * 1e18));
};

import { SuiClient } from "@mysten/sui.js/client";

const suiClient = new SuiClient({
  url: "https://fullnode.devnet.sui.io",
});

export default suiClient;

const express = require("express");
const Moralis = require("moralis").default;
const discord = require("discord.js");
const { EvmChain } = require("@moralisweb3/common-evm-utils")
const ethers = require("ethers")
require("dotenv").config();
const app = express();
const port = 3000;

const client = new discord.Client({
    intents: [],
  });

client.login(process.env.PASS);

const wallet = "0x24769Cfb25b71A94073613095a901A03B6fB3B49"

const chain = EvmChain.GOERLI

const balanceResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
  wallet,
  chain,
});

const balance = balanceResponse.toJSON()?.balance
const symbol = balanceResponse.toJSON()?.symbol

console.log(balance, symbol)

const known = [
  {
    user_id: "1158228529746554912",
    address: "0x24769Cfb25b71A94073613095a901A03B6fB3B49"
  },
  {
    user_id: "919141293878280203",
    address: "0xA3Db2Cb625bAe87D12AD769C47791a04BA1e5b29"
  }
]

app.use(express.json());

app.post("/webhook/", async (req, res) => {
  const { body, headers } = req;

  try {
    Moralis.Streams.verifySignature({
      body,
      signature: headers["x-signature"],
    });

    const fromAddress = body?.txs[0]?.fromAddress;
    const toAddress = body?.txs[0]?.toAddress;

    const fromUserObject = known.find(data => data.address.toLowerCase() === fromAddress);
    const toUserObject = known.find(data => data.address.toLowerCase() === toAddress);

    const fromUser = fromUserObject ? fromUserObject.user_id : fromAddress;
    const toUser = toUserObject ? toUserObject.user_id : toAddress;

    let amount = Number(body.txs[0]?.value / 1E18) || 0;

    console.log(fromAddress === wallet ? `@everyone Spade Treasury sent ${amount} Goerli Eth to <@${toUser}>🎉🎉🎉. Spade Treasury new balance is ${ethers.formatEther(balance)} ${symbol}. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}` : 
    `@everyone Spade Treasury received ${amount} Goerli Eth from <@${fromUser}>🎉🎉🎉. Spade Treasury new balance is ${ethers.formatEther(balance)} ${symbol}. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}`)

    const channel = await client.channels.fetch(process.env.CHANNEL);
    channel.send(
      fromAddress === wallet ? `@everyone Spade Treasury sent ${amount} Goerli Eth to <@${toUser}>🎉🎉🎉. Spade Treasury new balance is ${ethers.formatEther(balance)} ${symbol}. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}` : 
      `@everyone Spade Treasury received ${amount} Goerli Eth from <@${fromUser}>🎉🎉🎉. Spade Treasury new balance is ${ethers.formatEther(balance)} ${symbol}. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}`
    );

    return res.status(200).json();
  } catch (e) {
    console.log(e);
    return res.status(400).json();
  }
});

app.get("/webhook/", async () => {
  console.log("GET request received!!!")
  return res.status(200).json();
});

Moralis.start({
  apiKey: process.env.APIKEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening to streams🎉🎉🎉`);
  });
});
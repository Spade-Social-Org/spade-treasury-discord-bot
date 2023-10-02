const express = require("express");
const Moralis = require("moralis").default;
const discord = require("discord.js");
require("dotenv").config();
const app = express();
const port = 3000;

const client = new discord.Client({
    intents: [],
  });

client.login(process.env.PASS);

const wallet = "0x24769Cfb25b71A94073613095a901A03B6fB3B49"

const known = [
  {
    username: "Spade Treasury",
    address: "0x24769Cfb25b71A94073613095a901A03B6fB3B49"
  },
  {
    username: "@supreme2580",
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

    const fromUserObject = known.find(data => data.address.toLowerCase() == fromAddress);
    const toUserObject = known.find(data => data.address.toLowerCase() == toAddress);

    const fromUser = fromUserObject ? fromUserObject.username : fromAddress;
    const toUser = toUserObject ? toUserObject.username : toAddress;

    let amount = Number(body.txs[0]?.value / 1E18) || 0;

    console.log(fromAddress === wallet ? `@everyone Spade Treasury sent ${amount} Goerli Eth to ${toUser}🎉🎉🎉. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}` : 
    `@everyone Spade Treasury received ${amount} Goerli Eth from ${fromUser}🎉🎉🎉. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}`)

    const channel = await client.channels.fetch(process.env.CHANNEL);
    channel.send(
      fromAddress === wallet ? `@everyone Spade Treasury sent ${amount} Goerli Eth to ${toUser}🎉🎉🎉. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}` : 
      `@everyone Spade Treasury received ${amount} Goerli Eth from ${fromUser}🎉🎉🎉. You can confirm this transaction on https://goerli.etherscan.io/tx/${body?.txs[0]?.hash}`
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
import {
  Connection,
  clusterApiUrl,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
} from "@solana/spl-token";
import bs58 from "bs58";
import { readFile } from "fs/promises";
import "./modules/loadEnv.js";

const privatKey = process.env.PK;
const endpoint = process.env.ENDPOINT;

/**
 * Returns wallet Keypair
 * @param {String | Uint8Array} privatKey
 * @returns {Keypair}
 */
const loadWallet = (privatKey) => {
  if (typeof privatKey == "string") {
    const decodedString = bs58.decode(privatKey);
    return Keypair.fromSecretKey(new Uint8Array(decodedString));
  }

  if (privatKey instanceof Object) {
    return Keypair.fromSecretKey(new Uint8Array(decodedString));
  }
};

/**
 * Load JSON files
 * @param {String} path 
 * @returns {Object}
 */
const loadJson = async (path) => {
  return JSON.parse(await readFile(new URL(path, import.meta.url)));
};

/**
 * 
 * @param {Object} connection 
 * @param {PublicKey} tokenAddress 
 * @returns {Object}
 */
const getMintInfo = async (connection, tokenAddress) => {
  return await getMint(connection, tokenAddress);
};

/**
 * 
 * @param {BigInt} ms 
 * @returns 
 */
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const sendFunds = async (
  connection,
  sender,
  senderAtaPublicKey,
  receiverAtaPubKey,
  amountOfTokens
) => {
  try {
    const transaction = new Transaction();
    transaction.add(
      createTransferInstruction(
        senderAtaPublicKey,
        receiverAtaPubKey,
        sender.publicKey,
        amountOfTokens
      )
    );
    const latestBlockHash = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = await latestBlockHash.blockhash;
    return await sendAndConfirmTransaction(connection, transaction, [sender]);
  } catch (err) {
    console.log(err);
    return undefined;
  }
};


const calcTokens = async () => {
  var printArray = [];
  const payer = loadWallet(privatKey);
  const connection = endpoint
    ? new Connection(endpoint)
    : new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const distributionJson = await loadJson("./distribution.json");

  for (const tokenAddress in distributionJson) {
    const tokenPubKey = new PublicKey(tokenAddress);

    if (!(await getMintInfo(connection, tokenPubKey))) {
      console.log(`Unable to load token data from ${tokenAddress}`);
      continue;
    }

    const payerTokenAtaInfo = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      tokenPubKey,
      payer.publicKey
    );

    if (payerTokenAtaInfo?.amount === 0n) {
      console.log(`Sender has 0 tokens! ${tokenAddress}`);
      continue;
    } else {
      var amountOfTokens = parseFloat(payerTokenAtaInfo?.amount);
      console.log("Current amount of Tokens:", amountOfTokens);
    }

    for (const data of distributionJson[tokenAddress]) {
      const shareTokens = Math.floor(amountOfTokens * data.share);
      const calcShare = (shareTokens / amountOfTokens).toFixed(2);
      const successJson = {
        token: tokenAddress.slice(0, 8),
        wallet: data.pubKey,
        ataFound: false,
        allocation: shareTokens,
        realShare: calcShare,
      };
      const receiver = new PublicKey(data.pubKey);
      await sleep(10 ** 4);

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        tokenPubKey,
        receiver
      );

      if (!toTokenAccount?.address) {
        console.log(`Could not fetch ATA for Account: ${data.pubKey}`);
        printArray.push(successJson);
        continue;
      }

      successJson.ataFound = true;
      printArray.push(successJson);
    }
    console.table(printArray);
    var sumAmount = 0;
    for (const elmt of printArray) {
      sumAmount += elmt?.allocation;
    }
    console.log(
      `Sum of tokens in allocation: ${sumAmount}! (= ${sumAmount / amountOfTokens
      }%)`
    );
    printArray = [];

    console.log("\nRun > node sendDistribution.mjs to send trx!");
  }
};

const sendDistribution = async (tokenAddress) => {
  var printArray = [];
  const payer = loadWallet(privatKey);
  const connection = endpoint
    ? new Connection(endpoint)
    : new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const tokenPubKey = new PublicKey(tokenAddress);

  var distributionJson = await loadJson("./distribution.json");
  if (!distributionJson[tokenAddress]) {
    throw new Error("Distribution JSON does not include key:", tokenAddress);
  }

  if (!(await getMintInfo(connection, tokenPubKey))) {
    throw new Error(`Unable to load token data from ${tokenAddress}`);
  }

  const payerTokenAtaInfo = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenPubKey,
    payer.publicKey
  );

  if (payerTokenAtaInfo?.amount === 0n) {
    throw new Error(`Sender has 0 tokens! ${tokenAddress}`);
  } else {
    var amountOfTokens = parseFloat(payerTokenAtaInfo?.amount);
    console.log("Current amount of Tokens:", amountOfTokens);
  }

  for (const data of distributionJson[tokenAddress]) {
    const shareTokens = Math.floor(amountOfTokens * data.share);
    const calcShare = shareTokens / amountOfTokens;
    const receiver = new PublicKey(data.pubKey);
    const successJson = {
      token: tokenAddress.slice(0, 8),
      wallet: data.pubKey,
      ataFound: false,
      allocation: shareTokens,
      share: calcShare.toFixed(2),
      success: false,
    };
    
    await sleep(10 ** 4);
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      tokenPubKey,
      receiver
    );

    if (!toTokenAccount?.address) {
      console.log(`Could not fetch ATA for Account: ${data.pubKey}`);
      printArray.push(successJson);
      continue;
    }

    successJson.ataFound = toTokenAccount.address;
    printArray.push(successJson);
  }

  var sumAmount = 0;
  for (const elmt of printArray) {
    await sleep(10 ** 4);

    if (!elmt.ataFound) {
      continue;
    }

    const signature = await sendFunds(
      connection,
      payer,
      payerTokenAtaInfo.address,
      elmt.ataFound,
      elmt.allocation
    );

    if (!signature) {
      console.log("Transaction failed for Account:", elmt.wallet);
      continue;
    }
    sumAmount += elmt.allocation;
    elmt.ataFound = true;
    elmt.success = true;
  }
  console.table(printArray);
  console.log(`Sum of tokens send: ${sumAmount}! (= ${(sumAmount / amountOfTokens) * 100}%)`);
};

export { calcTokens, sendDistribution };

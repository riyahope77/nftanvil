import fs from "fs";
import fetch from "node-fetch";

import {
  Principal,
  routerCanister,
  nftCanister,
  encodeTokenId,
} from "./internal.js";

import {
  uploadFile,
  chunkBlob,
} from "@vvv-interactive/nftanvil-tools/cjs/data.js";

import pLimit from "p-limit";
const limit = pLimit(
  process.env.MINT_CONCURRENCY ? parseInt(process.env.MINT_CONCURRENCY, 10) : 20
); // Number of concurrent async requests. Don't get it too high or network may block you
import { blobFrom } from "fetch-blob/from.js";

export const easyMint = async (arr) => {
  await Promise.all(
    arr.map((a) => {
      return limit(() => easyMintOne(a));
    })
  );
};

export const uploadIPFS = async (up) => {
  if (typeof up === "string" && up.indexOf("blob:") === 0)
    up = await fetch(up).then((r) => r.blob());

  return fetch("https://nftpkg.com/nft/upload", {
    method: "POST",
    mode: "cors",
    body: up,
  })
    .then((d) => {
      return d.json();
    })
    .then((x) => {
      console.log(x);
      return x;
    });
};

export const pinIPFS = async (tokenid, cid, secret) => {
  return fetch(
    "https://nftpkg.com/nft/pin/" + tokenid + "/" + cid + "/" + secret,
    {
      method: "POST",
      mode: "cors",
    }
  )
    .then((d) => {
      return d.json();
    })
    .then((x) => {
      return x;
    });
};

export const easyMintOne = async ({ to, metadata }) => {
  console.log("EASYMINT");
  let ipfs_pins = [];
  if (metadata?.content[0]?.ipfs?.path) {
    let { ok, cid, secret } = await uploadIPFS(
      await blobFrom(metadata.content[0].ipfs.path)
    );
    ipfs_pins.push({ cid, secret });
    metadata.content[0].ipfs.cid = cid;
  }

  if (metadata?.thumb?.ipfs?.path) {
    let { ok, cid, secret } = await uploadIPFS(
      await blobFrom(metadata.thumb.ipfs.path)
    );
    ipfs_pins.push({ cid, secret });
    metadata.thumb.ipfs.cid = cid;
  }

  let { router } = await routerCanister();

  let available = await router.getAvailable();
  let nftcan = Principal.fromText(
    available[Math.floor(Math.random() * available.length)]
  );

  let nft = nftCanister(nftcan);

  if (
    metadata.extensionCanister[0] &&
    typeof metadata.extensionCanister[0] === "string"
  )
    metadata.extensionCanister[0] = Principal.fromText(
      metadata.extensionCanister[0]
    );

  if (metadata?.content[0]?.internal?.path)
    metadata.content[0].internal.size = getFilesizeInBytes(
      metadata.content[0].internal.path
    );

  if (metadata?.thumb?.internal?.path)
    metadata.thumb.internal.size = getFilesizeInBytes(
      metadata.thumb.internal.path
    );

  let s = await nft.mintNFT({ to, metadata });
  if (s.ok) {
    let tokenIndex = s.ok;
    let tid = encodeTokenId(nftcan.toText(), tokenIndex);

    for (let { cid, secret } of ipfs_pins) {
      let { ok, err } = await pinIPFS(tid, cid, secret);
      if (err) throw Error("Couldn't pin to IPFS");
    }

    if (metadata?.content[0]?.internal?.path)
      await uploadFile(
        nft,
        tokenIndex,
        "content",
        await chunkBlob(
          await blobFrom(metadata.content[0].internal.path),
          fetch
        )
      );

    if (metadata?.thumb?.internal?.path)
      await uploadFile(
        nft,
        tokenIndex,
        "thumb",
        await chunkBlob(await blobFrom(metadata.thumb.internal.path), fetch)
      );

    return tid;
  } else {
    throw s && s.err;
  }
};

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

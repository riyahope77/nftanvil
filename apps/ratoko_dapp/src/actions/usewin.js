import { createUsewinActor } from "../declarations/usewin.js";
import {
  useAnvilDispatch,
  useAnvilSelector,
  user_login,
  user_logout,
  nft_fetch,
  nft_use,
  user_pwr_transfer,
  user_refresh_balances,
} from "./link_lib";

import { base58ToBytes } from "@vvv-interactive/nftanvil-tools/cjs/data.js";

import { principalToAccountIdentifier } from "@vvv-interactive/nftanvil-tools/cjs/token.js";
import { Principal } from "@dfinity/principal";
import authentication from "../link_lib/auth.js";

import * as AccountIdentifier from "@vvv-interactive/nftanvil-tools/cjs/accountidentifier.js";
import * as TransactionId from "@vvv-interactive/nftanvil-tools/cjs/transactionid.js";

import { createSlice } from "@reduxjs/toolkit";
import { accountCanister } from "@vvv-interactive/nftanvil-canisters/cjs/account.js";
import { produce } from "immer";
import { PrincipalFromSlot } from "@vvv-interactive/nftanvil-tools/cjs/principal.js";
import { tokenToText } from "@vvv-interactive/nftanvil-tools/cjs/token.js";
import { toast } from "react-toastify";

export const msg =
  (msg, type = toast.TYPE.INFO) =>
  async (dispatch, getState) => {
    let toastId = toast(msg, {
      type,
      position: "bottom-center",
      isLoading: false,
      autoClose: true,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
    });
  };

export const stats = () => async (dispatch, getState) => {
  let ito = createUsewinActor({
    agentOptions: authentication.getAgentOptions(),
  });

  let stats = await ito.stats();
  //console.log(stats);
  return stats;
};

// export const airdrop_use = (key) => async (dispatch, getState) => {
//   const s = getState();

//   let address = AccountIdentifier.TextToArray(s.user.address);

//   let ito = createUsewinActor({
//     agentOptions: authentication.getAgentOptions(),
//   });

//   let brez = await ito.airdrop_use(address, base58ToBytes(key));

//   console.log("airdrop_use", brez);
//   if ("err" in brez) throw new Error(brez.err);

//   return brez.ok.map((x) => Number(x));
// };

const getStoredTx = () => {
  let rez;
  try {
    rez = JSON.parse(window.localStorage.getItem("usewin-tx")) || [];
  } catch (e) {
    rez = [];
  }

  return rez;
};

const saveStoredTx = (s) =>
  window.localStorage.setItem("usewin-tx", JSON.stringify(s));

const addStoredTx = (tx) => saveStoredTx([...getStoredTx(), tx]);

const remStoredTx = (tx) => saveStoredTx(getStoredTx().filter((a) => a !== tx));

export const unprocessed_tx = () => async (dispatch, getState) => {
  let ids = getStoredTx();
  if (!ids.length) return false;

  dispatch(msg("Processing interrupted transaction"));
  return dispatch(provide_tx(TransactionId.fromText(ids[0])));
};

export const usewin =
  ({ id }) =>
  async (dispatch, getState) => {
    const use = { cooldown: 10080 }; //

    let meta = await dispatch(nft_fetch(id));
    let now = Math.floor(Date.now() / 1000 / 60);
    if (meta.cooldownUntil >= now) throw new Error("cooldown");

    // make pwr transfer and get tx
    let { transactionId } = await dispatch(nft_use({ id, use, memo: [] }));

    addStoredTx(TransactionId.toText(transactionId));

    return dispatch(provide_tx(transactionId));
  };

export const provide_tx = (txid) => async (dispatch, getState) => {
  const s = getState();

  let address = AccountIdentifier.TextToArray(s.user.address);

  let subaccount = [
    AccountIdentifier.TextToArray(s.user.subaccount) || null,
  ].filter(Boolean);

  let usewin = createUsewinActor({
    agentOptions: authentication.getAgentOptions(),
  });

  // const attempt = async () => {
  // send tx_id to our custom ito.mo contract
  let brez;
  try {
    brez = await usewin.use_tx(txid, subaccount);

    console.log("use_tx", brez);

    remStoredTx(TransactionId.toText(txid));

    if ("err" in brez) {
      return false;
    }

    return brez.ok.map((x) => Number(x));
  } catch (e) {
    throw new Error(
      "Attempted with no result. Are you sure you are connected?"
    );
  }
  // };

  // for (let i = 0; i < 10; i++) {
  //   try {
  //     return await attempt();
  //   } catch (e) {
  //     await delay(i * 1000);
  //     console.log(e);
  //   }
  // }
};

export const claim = () => async (dispatch, getState) => {
  const s = getState();

  let address = AccountIdentifier.TextToArray(s.user.address);

  let subaccount = [
    AccountIdentifier.TextToArray(s.user.subaccount) || null,
  ].filter(Boolean);

  let ito = createUsewinActor({
    agentOptions: authentication.getAgentOptions(),
  });

  let owned = await ito.owned(address);
  if (owned.err) throw new Error(owned.err);

  let tokens = owned.ok.tokens.filter(Boolean);

  if (tokens.length > 0) dispatch(msg("Claiming " + tokens.length + " nfts"));

  let claimed = await Promise.all(
    tokens.map((tid) => {
      return ito.claim(address, subaccount, tid);
    })
  );
};

export const get_mine = () => async (dispatch, getState) => {
  let s = getState();
  if (!s.user.map.account?.length) return null;
  let address = s.user.address;

  let can = PrincipalFromSlot(
    s.user.map.space,
    AccountIdentifier.TextToSlot(address, s.user.map.account)
  );

  let acc = accountCanister(can, {
    agentOptions: authentication.getAgentOptions(),
  });

  let pageIdx = 0;
  let max = 100;
  let final = [];
  do {
    let list = await acc.list(
      AccountIdentifier.TextToArray(address),
      pageIdx * max,
      (pageIdx + 1) * max
    );

    list = list.filter((x) => x !== 0n).map((x) => Number(x));

    if (list.length === 0) break;

    final.push(...list);
    pageIdx++;
  } while (true);

  return final;
};

const delay = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

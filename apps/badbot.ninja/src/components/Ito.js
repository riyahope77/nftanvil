import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import {
  useAnvilDispatch,
  user_refresh_balances,
} from "@vvv-interactive/nftanvil-react";
import { NftThumb } from "./Nft";

import {
  buy,
  claim,
  get_mine,
  airdrop_use,
  stats,
  provide_tx,
  msg,
} from "../actions/purchase";
import * as AccountIdentifier from "@vvv-interactive/nftanvil-tools/cjs/accountidentifier.js";
import Confetti from "./Confetti.js";
import { ButtonModal } from "./Tools.js";
import nfts from "../nfts.json";

function Basket({ ids, onClose }) {
  let nftcut = nfts
    ? nfts.filter((x) => {
        return ids.indexOf(x[0]) !== -1;
      })
    : nfts;

  return (
    <div className="basket">
      <div className="inner">
        <Confetti />
        <div className="title">Congratulations!</div>
        <div className="subtitle">You just got {ids.length} NFTs</div>
        <div className="actions">
          <button onClick={() => onClose()}>OK</button>
        </div>
        <div className="collection">
          {nftcut.map((nft, idx) => {
            return <NftThumb nft={nft} key={nft[0]} />;
          })}
        </div>
        <div className="actions">
          <button onClick={() => onClose()}>OK</button>
        </div>
      </div>
    </div>
  );
}

function BuyButton({ price, className, refreshMine }) {
  const [confirm, setConfirm] = React.useState(false);
  const dispatch = useAnvilDispatch();
  const [working, setWorking] = React.useState(false);
  const [basket, setBasket] = React.useState(false);

  if (working) return <div className="buybutton">Purchasing...</div>;
  return (
    <div className="buybutton">
      {confirm ? (
        <div style={{ width: "100%", position: "absolute", top: "-23px" }}>
          confirm
        </div>
      ) : null}
      <button
        className={className}
        onClick={async () => {
          if (!confirm) setConfirm(true);
          else {
            setWorking(true);
            let basket = false;
            try {
              basket = await dispatch(buy(price));
            } catch (e) {
              dispatch(msg(e.message));
              setWorking(false);
              setConfirm(false);
              return;
            }

            setBasket(basket);
            setWorking(false);
            setConfirm(false);

            // we don't need these immediately

            dispatch(user_refresh_balances());

            await dispatch(claim());
            refreshMine();
          }
        }}
      >
        {confirm ? "Yes" : "Buy Now"}
      </button>
      {confirm ? (
        <button
          onClick={() => {
            setConfirm(false);
          }}
        >
          No
        </button>
      ) : null}
      {basket
        ? ReactDOM.createPortal(
            <Basket
              ids={basket}
              onClose={() => {
                setBasket(false);
              }}
            />,
            document.body
          )
        : null}
    </div>
  );
}

export function PriceOptions({ refreshMine }) {
  const dispatch = useAnvilDispatch();
  const codeInput = useRef(null);

  const price_1 = 29940120;
  const price_2 = 479041916;
  const price_3 = 134730539;

  const showPrice = (x) => {
    let p = (Math.round(AccountIdentifier.e8sToIcp(x) * 100) / 100)
      .toString()
      .split(/[\.\,]/);

    return (
      <span>
        {p[0]}
        <b>.{p[1]} ICP</b>
      </span>
    );
  };

  return (
    <div>
      <div className="priceOptions">
        <div className="priceBox">
          <div className="title">Shot</div>
          <div className="price">{showPrice(price_1)}</div>
          <div className="ftrs">
            <div className="feature">1 NFT</div>
          </div>
          <BuyButton
            className="attention"
            price={29940120}
            refreshMine={refreshMine}
          />
        </div>

        <div className="priceBox attention">
          <div className="title">BFF</div>
          <div className="price">{showPrice(price_2)}</div>
          <div className="ftrs">
            <div className="feature">20 NFTs</div>
            <div className="feature">20% discount</div>
          </div>

          <BuyButton
            className="attention"
            price={479041916}
            refreshMine={refreshMine}
          />
        </div>

        <div className="priceBox">
          <div className="title">Splash</div>
          <div className="price">{showPrice(price_3)}</div>
          <div className="ftrs">
            <div className="feature">5 NFTs</div>
            <div className="feature">10% discount</div>
          </div>
          <BuyButton
            className="attention"
            price={134730539}
            refreshMine={refreshMine}
          />
        </div>
      </div>
      <div className="airdropOptions">
        <ButtonModal name="Use airdrop code">
          {({ setVisibility }) => (
            <div className="modal-airdrop-code">
              <div className="modal-title">Use airdrop code</div>
              <div>
                <label htmlFor="code">Code</label>
                <input ref={codeInput} type="text" id="code"></input>
              </div>

              <div className="modal-actions">
                <button onClick={() => setVisibility(false)}>Cancel</button>
                <button
                  className="attention"
                  onClick={() => {
                    dispatch(airdrop_use(codeInput.current.value));
                  }}
                >
                  Use
                </button>
              </div>
            </div>
          )}
        </ButtonModal>
      </div>
    </div>
  );
}

export function ProgressBar() {
  const [st, setStats] = React.useState(false);
  const [count, setCount] = useState(0);

  const dispatch = useAnvilDispatch();
  const load = async () => {
    setStats(await dispatch(stats()));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      load();
      setCount(count + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [count, dispatch]);

  if (!st) return null;

  let available = Math.min(Number(st.available), Number(st.purchase));
  let total = Number(st.total);

  let airdrop = Number(st.airdrop);
  // let purchase = Number(st.purchase);
  const perc = ((total - available) / total) * 100;
  //console.log(perc);
  return (
    <>
      <div className="pbar-shell">
        <div className="pbar-inner" style={{ width: perc + "%" }}></div>
      </div>
      <div className="pbar-info">
        {total} total | {available} left
      </div>
    </>
  );
}

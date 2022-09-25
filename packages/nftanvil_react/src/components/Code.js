/* global BigInt */
import React, { useEffect, useState } from "react";

import styled from "@emotion/styled";
import * as AccountIdentifier from "@vvv-interactive/nftanvil-tools/cjs/accountidentifier.js";

import {
  useAnvilSelector as useSelector,
  useAnvilDispatch as useDispatch,
} from "../index.js";

import { Tooltip } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";
const Stx = styled.span`
  font-family: Verdana;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgb(117, 130, 149);
  b {
    color: rgb(110, 200, 170);
  }
`;

export const TX = ({ children }) => {
  return (
    <Stx>
      <b>TX</b>
      {children.slice(2)}
    </Stx>
  );
};

const Sacc = styled.span`
  font-family: Verdana;
  font-size: 80%;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${(props) =>
    props.mode === "light" ? "rgb(230, 240, 240)" : "rgb(90, 100, 100)"};
  b {
    color: rgb(170, 255, 0);
  }
`;

const hexColors = {
  light: {
    0: "#49fc32",
    1: "#a7ef15",
    2: "#e8dc16",
    3: "#ffbb33",
    4: "#ff906c",
    5: "#ff87b3",
    6: "#ff92ff",
    7: "#ffa9ff",
    8: "#c8c8ff",
    9: "#00e4ff",
    A: "#00f3ff",
    B: "#29f7db",
    C: "#c9e1bb",
    D: "#ffc8d1",
    E: "#e8cfff",
    F: "#cdd9fd",
  },
  dark: {
    0: "#219812",
    1: "#6f9f0d",
    2: "#8c8509",
    3: "#946507",
    4: "#902705",
    5: "#840835",
    6: "#8e088e",
    7: "#950b95",
    8: "#09098b",
    9: "#097b88",
    A: "#07757a",
    B: "#067969",
    C: "#38850b",
    D: "#a41d33",
    E: "#4e1187",
    F: "#153081",
  },
};

export const ACC = ({ children, short = false }) => {
  const mode = useColorModeValue("dark", "light");
  const color = hexColors[mode];

  let a = children
    .slice(0, 5)
    .toUpperCase()
    .split("")
    .map((x, idx) => (
      <span key={idx} style={{ color: color[x] }}>
        {x}
      </span>
    ));
  let b = children.slice(5, -5);
  let c = children
    .slice(-5)
    .toUpperCase()
    .split("")
    .map((x, idx) => (
      <span key={idx} style={{ color: color[x] }}>
        {x}
      </span>
    ));

  return (
    <Sacc mode={mode}>
      <b>{a}</b>
      {short ? "..." : b}
      <b>{c}</b>
    </Sacc>
  );
};

const Spri = styled.span`
  font-family: Verdana;
  font-size: 80%;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgb(220, 220, 220);
  b {
    color: rgb(220, 220, 220);
  }
`;

export const PRI = ({ children }) => {
  let p = children.split("-");
  return (
    <Spri>
      {p.map((x, idx) => {
        return (
          <span key={idx}>
            {idx !== 0 ? "-" : null}
            <b>{x}</b>
          </span>
        );
      })}
    </Spri>
  );
};

const Snfta = styled.span`
  font-family: Verdana;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgb(117, 130, 149);
  b {
    color: rgb(250, 0, 120);
  }
`;

export const NFTA = ({ children }) => {
  if (!children)
    return (
      <Snfta>
        <b>NFTA</b>
      </Snfta>
    );
  return (
    <Snfta>
      <b>NFTA</b>
      {children.slice(4)}
    </Snfta>
  );
};

const Shash = styled.span`
  font-family: Verdana;
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${(props) =>
    props.mode === "light" ? "#377a5f" : "rgb(110, 200, 170)"};

  b {
    color: ${(props) =>
      props.mode === "light" ? "#005e47" : "rgb(140, 240, 220)"};
  }
`;

export const HASH = ({ children, short = false }) => {
  const mode = useColorModeValue("light", "dark");
  let t = short
    ? (children = children.slice(0, 4) + ".." + children.slice(-4))
    : children;

  let txt = t
    .split("")
    .map((x, idx) => (Math.floor(idx / 2) % 2 == 0 ? <b key={idx}>{x}</b> : x));
  return <Shash mode={mode}>{txt}</Shash>;
};

/* global BigInt */
import React, { useEffect, useState } from "react";

import {
  Text,
  useColorMode,
  Stack,
  Box,
  useColorModeValue,
  AbsoluteCenter,
  Skeleton,
  Image,
} from "@chakra-ui/react";
import { itemQuality } from "@vvv-interactive/nftanvil-tools/cjs/items.js";
import { err2text } from "@vvv-interactive/nftanvil-tools/cjs/data.js";
import {
  nft_fetch,
  nft_enter_code,
  nft_burn,
  nft_transfer,
  nft_use,
  nft_transfer_link,
  nft_claim_link,
  nft_plug,
  nft_unsocket,
  nft_set_price,
  nft_purchase,
  nft_recharge,
  nft_recharge_quote,
} from "../reducers/nft";
import { ft_fetch_meta, ft_promote } from "../reducers/ft";
import { task_start, task_end, task_run } from "../reducers/task";
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
} from "@chakra-ui/react";

import { move_item } from "../reducers/inventory";
import { verify_domain, verify_domain_twitter } from "../reducers/verify";

import { NftHistory } from "./History";
import { Spinner } from "@chakra-ui/react";
import { LoginRequired } from "./LoginRequired";
import { toast } from "react-toastify";
import {
  useAnvilSelector as useSelector,
  useAnvilDispatch as useDispatch,
  dialog_open,
  ft_all_tokens,
  FTSelect,
} from "../index.js";
import { tokenFromText } from "@vvv-interactive/nftanvil-tools/cjs/token.js";

import {
  Center,
  Button,
  Wrap,
  useDisclosure,
  FormLabel,
  FormControl,
  Input,
  Tooltip,
} from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  HStack,
  Tag,
} from "@chakra-ui/react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Spacer,
} from "@chakra-ui/react";

import { CheckIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { VerifiedIcon } from "../icons";
import moment from "moment";
import styled from "@emotion/styled";
import thumb_bg from "../assets/default.png";
import thumb_over from "../assets/over.png";
import * as AccountIdentifier from "@vvv-interactive/nftanvil-tools/cjs/accountidentifier.js";
import * as TransactionId from "@vvv-interactive/nftanvil-tools/cjs/transactionid.js";
import { Principal } from "@dfinity/principal";
import {
  TransactionToast,
  TransactionFailed,
} from "../components/TransactionToast";
import { TX, ACC, NFTA, HASH, ICP, ANV, PWR, FTI } from "./Code";
import { toHexString } from "@vvv-interactive/nftanvil-tools/cjs/data.js";
import { MARKETPLACE_AID, MARKETPLACE_SHARE, ANVIL_SHARE } from "../config.js";
import {
  AVG_MESSAGE_COST,
  FULLY_CHARGED_MINUTES,
} from "@vvv-interactive/nftanvil-tools/cjs/pricing.js";
import { TaskButton } from "./TaskButton";

import { useDrag } from "react-dnd";

const Busy = styled.div`
  display: inline-block;
  width: 72px;
  height: 72px;

  :after {
    content: " ";
    display: block;
    width: 52px;
    height: 52px;
    margin: 10px;
    border-radius: 50%;
    border: 4px solid #333;
    border-color: #333 transparent #333 transparent;
    animation: lds-dual-ring 1.2s linear infinite;
  }

  @keyframes lds-dual-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Thumb = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 6px;
  position: relative;
  box-overflow: hidden;
  cursor: pointer;

  .border {
    top: 0px;
    left: 0px;
    position: absolute;
    background: url(${thumb_bg});
    user-select: none;
    pointer-events: none;
    background-size: 72px 72px;
    width: 72px;
    height: 72px;

    &:hover {
      background-image: url(${thumb_over});
      user-select: none;
      pointer-events: none;
    }
  }
  .custom {
    top: 0px;
    left: 0px;
    position: absolute;
    margin: 4px 4px;
    object-fit: cover;
    object-position: center center;
    height: 64px;
    width: 64px;
    border-radius: 8px;
  }

  img {
    user-select: none;
    pointer-events: none;
  }
`;

const ThumbLarge = styled.div`
  position: relative;
  box-overflow: hidden;
  // img {
  //   background-color: #1e1b24;
  //   border: 1px solid
  //     ${(props) => (props.mode === "light" ? "#c4bcdb" : "#3f3855")};
  //   border-bottom: 0px solid;
  // }
  .custom {
    top: 0px;
    left: 0px;
    position: absolute;
    // object-fit: cover;
    background-position: center center;
    // border: 1px solid red;
    background: url(${(p) => p.img});
    background-size: cover;
    height: ${(p) => p.h - 54}px;
    width: ${(p) => p.w}px;
    border-radius: 8px 8px 0px 0px;
  }

  .info {
    font-size: 12px;
    position: absolute;
    padding-bottom: 3px;
    padding-left: 10px;
    border-radius: 0px 0px 6px 6px;
    left: 0px;
    top: ${(p) => p.h - 54}px;
    right: 0px;
    height: 54px;

    // text-shadow: 4px 4px 2px rgba(0, 0, 0, 0.6);
    background: ${(props) => (props.mode === "light" ? "#fff" : "#1d1b24")};
    border: 1px solid
      ${(props) => (props.mode === "light" ? "#c4bcdb" : "#3f3855")};
    border-top: 0px solid;
    .label {
      font-size: 9px;
      margin-bottom: -2px;
    }
    .collection {
      position: absolute;
      top: 0px;
    }
    .author {
      position: absolute;
      top: 19px;
    }
    .price {
      text-align: right;
      position: absolute;
      top: 19px;
      right: 8px;
    }
  }
`;

export const NFTMenu = ({ id, meta, owner, nobuy = false, renderButtons }) => {
  return (
    <Box p={3} maxWidth="375px" textAlign="justify">
      {owner ? (
        <Wrap spacing="3">
          {renderButtons ? renderButtons({ id, meta }) : null}
          <RechargeButton id={id} meta={meta} />
          {/* <PromoteButton id={id} meta={meta} /> */}

          <UseButton id={id} meta={meta} />
          <TransferButton id={id} meta={meta} />
          <TransferLinkButton id={id} meta={meta} />
          <SetPriceButton id={id} meta={meta} />

          <BurnButton id={id} meta={meta} />
          <SocketButton id={id} meta={meta} />
          <UnsocketButton id={id} meta={meta} />
        </Wrap>
      ) : (
        <Wrap>
          {!nobuy && meta.transferable && meta.price.amount !== "0" ? (
            <BuyButton id={id} meta={meta} />
          ) : null}
        </Wrap>
      )}
    </Box>
  );
};

function SetPriceButton({ address, id, meta }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [token, setToken] = useState(false);
  const dispatch = useDispatch();

  // const address = useSelector((state) => state.user.address);
  const task_id = id + "sell";

  const initialRef = React.useRef();

  const removeSale = async () => {
    onClose();

    let price = {
      amount: 0,
      token: 0,
      marketplace: [
        {
          address: AccountIdentifier.TextToArray(MARKETPLACE_AID),
          share: MARKETPLACE_SHARE,
        },
      ],
    };

    try {
      dispatch(task_start({ task_id }));
      await dispatch(nft_set_price({ id, price }));
      dispatch(task_end({ task_id }));
    } catch (e) {
      dispatch(
        task_end({
          task_id,
          result: { err: true, msg: err2text(e) },
        })
      );

      console.error("Remove from sale error", e);
    }
  };
  const setPriceOk = async () => {
    let priceval = parseFloat(initialRef.current.value);
    let payment_token = parseFloat(token.id);

    let amount;
    if ("fractionless" in token.kind) {
      amount = priceval;
    } else {
      amount = AccountIdentifier.icpToE8s(
        priceval /
          (1 - (MARKETPLACE_SHARE + ANVIL_SHARE + meta.authorShare) / 10000)
      );
    }

    let price = {
      amount: amount,
      token: payment_token,
      marketplace: [
        {
          address: AccountIdentifier.TextToArray(MARKETPLACE_AID),
          share: MARKETPLACE_SHARE,
        },
      ],
    };
    // console.log(price);

    onClose();

    try {
      dispatch(task_start({ task_id }));

      await dispatch(nft_set_price({ id, price }));
      dispatch(task_end({ task_id }));
    } catch (e) {
      console.error("SetPrice error", e);
      dispatch(
        task_end({
          task_id,
          result: { err: true, msg: err2text(e) },
        })
      );
    }
  };

  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={onOpen}
        w={"90px"}
        loadingText="Sell"
      >
        Sell
      </TaskButton>

      <Modal
        initialFocusRef={initialRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        size={"xl"}
        preserveScrollBarGap={true}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Sell Price</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <HStack>
                <FTSelect
                  value={token?.id}
                  onChange={(t) => {
                    setToken(t);
                  }}
                />

                {token ? (
                  <NumberInput
                    w={"100%"}
                    {...("normal" in token.kind
                      ? {
                          precision: 4,
                          step: 0.01,
                        }
                      : {
                          precision: 0,
                          step: 1,
                        })}
                    //max="0.12"
                    min="0"
                    variant="filled"
                  >
                    <NumberInputField ref={initialRef} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ) : null}
              </HStack>
              {/* <Input  ref={initialRef} placeholder="0.001" max="0.06" min="0.0004"/> */}
            </FormControl>
            {token && "normal" in token.kind ? (
              <Box fontSize="12px" mt={2}>
                <Text>The amount you specify is increased by:</Text>
                <Text>
                  {(MARKETPLACE_SHARE / 100).toFixed(2)}% Marketplace share.
                </Text>
                <Text>
                  {(ANVIL_SHARE / 100).toFixed(2)}% Anvil protocol share.
                </Text>
                <Text>
                  {(meta.authorShare / 100).toFixed(2)}% NFT author share.
                </Text>
                <Text>
                  Additional flat recharge fee if it's not fully charged.
                </Text>
              </Box>
            ) : (
              <Box fontSize="12px" mt={2}>
                When priced in fractionless tokens, there are no royalties and
                fees
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button ml={3} onClick={removeSale}>
              Remove from sale
            </Button>
            <Button ml={3} onClick={setPriceOk}>
              Set for sale
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function TransferButton({ id, meta }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [alertOpen, setAlertOpen] = React.useState(false);
  const task_id = id + "transfer";

  const dispatch = useDispatch();
  const initialRef = React.useRef();

  const confirmOk = async () => {
    let toAddress = initialRef.current.value.toUpperCase();

    onClose();
    setAlertOpen(false);
    makeTransfer(toAddress);
  };

  const transferOk = async () => {
    let toAddress = initialRef.current.value.toUpperCase();
    if (
      toAddress.toLowerCase().indexOf("a00") !== 0 &&
      toAddress.toLowerCase().indexOf("ae0") !== 0
    )
      return setAlertOpen(true);

    onClose();
    makeTransfer(toAddress);
  };

  const makeTransfer = async (toAddress) => {
    try {
      dispatch(task_start({ task_id }));
      await dispatch(nft_transfer({ id, toAddress }));
      dispatch(task_end({ task_id }));
    } catch (e) {
      dispatch(task_end({ task_id, result: { err: true, msg: err2text(e) } }));
    }
  };
  return (
    <>
      <TaskButton
        isDisabled={!meta.transferable}
        task_id={task_id}
        onClick={onOpen}
        w={"120px"}
        loadingText="Transfer"
      >
        Transfer
      </TaskButton>

      <AlertDialog isOpen={alertOpen} preserveScrollBarGap={true} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>
                  Warning!
                  <br />
                  Address may not support this NFT
                </AlertTitle>
              </Alert>
            </AlertDialogHeader>

            <AlertDialogBody>
              Anvil addresses start with A00 or AE0 and this one doesn't. If you
              send to such address you may not be able to access your NFT.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={() => setAlertOpen(false)}>Cancel</Button>
              <Button colorScheme="red" onClick={confirmOk} ml={3}>
                Send anyway
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal
        initialFocusRef={initialRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        size={"xl"}
        preserveScrollBarGap={true}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send NFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>To Address</FormLabel>
              <Input ref={initialRef} placeholder="50e3df3..." />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button ml={3} onClick={transferOk}>
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function UnsocketButton({ id }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useDispatch();
  const initialRef = React.useRef();
  const task_id = id + "unsocket";

  const transferOk = async () => {
    let plug_id = initialRef.current.value;
    onClose();

    dispatch(
      task_run(task_id, async () => {
        let { transactionId } = await dispatch(
          nft_unsocket({ socket_id: id, plug_id })
        );
      })
    );
  };
  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={onOpen}
        w={"100px"}
        loadingText="Unsocket"
      >
        Unsocket
      </TaskButton>

      <Modal
        initialFocusRef={initialRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        size={"xl"}
        preserveScrollBarGap={true}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Unplug NFT from socket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Target plug token identifier</FormLabel>
              <Input ref={initialRef} placeholder="NFTA29SL..." />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button ml={3} onClick={transferOk}>
              Unplug
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function SocketButton({ id }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useDispatch();
  const initialRef = React.useRef();
  const task_id = id + "socket";

  const transferOk = async () => {
    let socket_id = initialRef.current.value;
    onClose();

    dispatch(
      task_run(task_id, async () => {
        let { transactionId } = await dispatch(
          nft_plug({ plug_id: id, socket_id })
        );
      })
    );
  };
  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={onOpen}
        w={"100px"}
        loadingText="Socket"
      >
        Socket
      </TaskButton>

      <Modal
        initialFocusRef={initialRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        size={"xl"}
        preserveScrollBarGap={true}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Plug NFT into socket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Target socket token identifier</FormLabel>
              <Input ref={initialRef} placeholder="NFTA29SL..." />
              <Text p={1} mt={1}>
                Both the plug and the socket need to be owned by the same
                account
              </Text>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button ml={3} onClick={transferOk}>
              Plug
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export const UseButton = ({ id, meta }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onClose = () => setIsOpen(false);
  const dispatch = useDispatch();
  const task_id = id + "use";
  const cancelRef = React.useRef();

  const useOk = async () => {
    onClose();

    try {
      let useData = { cooldown: 1 };
      let memo = [12, 10, 5, 0, 0, 1, 7];
      dispatch(task_start({ task_id }));

      let { transactionId } = await dispatch(
        nft_use({ id, use: useData, memo })
      );

      dispatch(task_end({ task_id, result: { err: false, msg: "Success" } }));
    } catch (e) {
      // let msg = "OnCooldown" in e ? "On cooldown" : JSON.stringify(e);
      dispatch(task_end({ task_id, result: { err: true, msg: err2text(e) } }));
    }
  };

  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={() => setIsOpen(true)}
        w={"90px"}
        loadingText="Use"
      >
        Use
      </TaskButton>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        preserveScrollBarGap={true}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Use NFT
            </AlertDialogHeader>

            <AlertDialogBody>
              This use is for demo purposes. Once used, the NFT will have 2 min
              cooldown.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={useOk} ml={3}>
                Use
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export const TransferLinkButton = ({ id, meta }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const task_id = id + "gift";

  const onClose = () => setIsOpen(false);
  const dispatch = useDispatch();

  const cancelRef = React.useRef();

  const transferOk = async () => {
    onClose();
    dispatch(
      task_run(
        task_id,
        async () => {
          let code = await dispatch(nft_transfer_link({ id }));

          navigator.clipboard.writeText("https://nftanvil.com/" + code);
        },
        { successMsg: "Copied to clipboard" }
      )
    );
  };

  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={() => setIsOpen(true)}
        isDisabled={!meta.transferable}
        w={"90px"}
        loadingText="Gift"
      >
        Gift
      </TaskButton>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        preserveScrollBarGap={true}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Create gift code
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? Anyone with the code/link will be able to take the
              NFT from you.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>

              <Button colorScheme="red" onClick={transferOk} ml={3}>
                Create link
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export const BuyButton = ({ id, meta }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onClose = () => setIsOpen(false);
  const dispatch = useDispatch();
  const task_id = id + "buy";

  const cancelRef = React.useRef();

  let amount = BigInt(meta.price.amount);
  const payment_token = Number(meta.price.token) || 1;
  const ftmeta = useSelector((s) => s.ft[payment_token]);
  const address = useSelector((s) => s.user.main_account);

  useEffect(() => {
    dispatch(ft_fetch_meta(payment_token));
  }, [payment_token, dispatch]);
  if (!ftmeta) return null;
  const buyOk = async () => {
    onClose();

    dispatch(
      task_run(task_id, async () => {
        await dispatch(
          nft_purchase({
            address,
            id,
            payment_token,
            payment_token_kind: ftmeta.kind,
            amount,
          })
        );
      })
    );
  };

  return (
    <>
      <TaskButton
        colorScheme={"green"}
        size="lg"
        task_id={task_id}
        onClick={async () => {
          setIsOpen(true);
        }}
        loadingText="Buying"
      >
        Buy
      </TaskButton>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        preserveScrollBarGap={true}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Buy NFT
            </AlertDialogHeader>

            <AlertDialogBody>
              Buy for {AccountIdentifier.e8sToIcp(amount)} ICP ?
              <Text fontSize="12px" mt="2">
                The price includes full recharge
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={buyOk} ml={3}>
                Buy
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export const BurnButton = ({ id }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onClose = () => setIsOpen(false);
  const dispatch = useDispatch();
  const task_id = id + "burn";
  const cancelRef = React.useRef();

  const burnOk = async () => {
    onClose();

    dispatch(
      task_run(task_id, async () => {
        let { transactionId } = await dispatch(nft_burn({ id }));
      })
    );
  };
  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={() => setIsOpen(true)}
        w={"90px"}
        loadingText="Burn"
      >
        Burn
      </TaskButton>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        preserveScrollBarGap={true}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Burn NFT
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This will destroy the NFT completely. You can't undo
              this action afterwards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={burnOk} ml={3}>
                Burn
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export const RechargeButton = ({ id, meta }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rechargeCost, setRechargeCost] = React.useState(0);
  const task_id = id + "recharge";
  const onClose = () => setIsOpen(false);
  const dispatch = useDispatch();

  const cancelRef = React.useRef();

  useEffect(() => {
    dispatch(nft_recharge_quote({ id })).then((re) => {
      setRechargeCost(re);
    });
  }, [id, meta, dispatch]);

  const rechargeOk = async () => {
    onClose();

    dispatch(
      task_run(task_id, async () => {
        await dispatch(nft_recharge({ id, amount: rechargeCost }));
      })
    );
  };

  if (!rechargeCost) return null;
  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={() => setIsOpen(true)}
        w={"240px"}
        loadingText="Recharging"
      >
        <Text mr="2">Recharge for </Text>
        <ICP>{rechargeCost}</ICP>
      </TaskButton>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        preserveScrollBarGap={true}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Recharge NFT
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This will take <ICP>{rechargeCost}</ICP> from your
              balance and put it in the NFT
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={rechargeOk} ml={3}>
                Recharge
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export const PromoteButton = ({ id, meta }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const task_id = id + "promote";
  const onClose = () => setIsOpen(false);
  const dispatch = useDispatch();
  const address = useSelector((s) => s.user.main_account);
  const cancelRef = React.useRef();

  const amount = 100000000;

  const promoteOk = async () => {
    onClose();

    const target = {
      nft: tokenFromText(id),
    };
    const location = 1;

    dispatch(
      task_run(task_id, async () => {
        await dispatch(
          ft_promote({ payment_token: 2, target, location, address, amount })
        );
      })
    );
  };

  return (
    <>
      <TaskButton
        task_id={task_id}
        onClick={() => setIsOpen(true)}
        w={"240px"}
        loadingText="Promoting"
      >
        <Text mr="2">Promote for </Text>
        <ANV>{amount}</ANV>
      </TaskButton>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        preserveScrollBarGap={true}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Promote NFT to Homepage
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This will take <ANV>{amount}</ANV> from your
              balance.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={promoteOk} ml={3}>
                Promote
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export const NFTPopover = ({ id, meta }) => {
  return (
    <Stack>
      <Center>
        <NFTInfo id={id} meta={meta} />
      </Center>
    </Stack>
  );
};

export const NFTLarge = ({
  id,
  onClick,
  custom = false,
  showDomain = false,
  width = 216,
  height = 270,
}) => {
  const meta = useSelector((state) => state.nft[id]);

  const mode = useColorModeValue("light", "dark");

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(nft_fetch(id));
  }, [id, dispatch]);

  // if (!meta) return null;

  return (
    <Skeleton w={width} h={height} isLoaded={!!meta}>
      {!!meta ? (
        <ThumbLarge
          mode={mode}
          w={width}
          h={height}
          onClick={onClick}
          style={{ cursor: onClick ? "pointer" : "auto" }}
          img={
            meta.thumb?.ipfs?.url ||
            meta.thumb?.internal?.url ||
            meta.thumb?.external ||
            ""
          }
        >
          <div className="custom"></div>
          <div className="info">
            {showDomain && meta.domain ? (
              meta.domain.indexOf("twitter.com/") !== -1 ? (
                <MetaDomainTwitter
                  key={"domain"}
                  meta={meta}
                  showLink={false}
                />
              ) : (
                <MetaDomain key={"domain"} meta={meta} showLink={false} />
              )
            ) : null}

            {custom ? (
              custom(meta)
            ) : (
              <div className="author">
                <div className="label">AUTHOR</div>
                <div>
                  <ACC short={true}>{meta.author}</ACC>
                </div>
              </div>
            )}
            {meta.price.amount && meta.price.amount !== "0" ? (
              <div className="price">
                <div className="label">PRICE</div>
                <ICP digits={2}>{meta.price.amount}</ICP>
              </div>
            ) : null}
          </div>
        </ThumbLarge>
      ) : null}
    </Skeleton>
  );
};

export const NFT = ({ token, aid, thumbSize, onClick }) => {
  const dispatch = useDispatch();
  const meta = useSelector((state) => state.nft[token.id]);
  let busy = meta && meta.busy;
  const [{ opacity, dragging }, dragRef] = useDrag(
    () => ({
      type: "token",
      item: { token },
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (item && dropResult) {
          dispatch(
            move_item({
              from_aid: aid,
              to_aid: dropResult.aid,
              token: item.token,
              pos: dropResult.pos,
            })
          );
        }
      },
      canDrag: (monitor) => !busy,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
        dragging: monitor.isDragging(),
      }),
    }),
    [busy]
  );

  const [mouseOver, setMouseOver] = useState(false);
  const popoverOpen = !dragging && mouseOver;

  useEffect(() => {
    dispatch(nft_fetch(token.id));
  }, [token, dispatch]);

  return (
    <Thumb
      ref={dragRef}
      style={{
        opacity: busy ? "0.3" : opacity,
        zIndex: popoverOpen ? 10 : 0,
        // cursor: onClick ? "pointer" : "auto",
      }}
      onClick={onClick}
      onMouseOver={() => {
        setMouseOver(true);
      }}
      onMouseDown={() => {
        setMouseOver(false);
      }}
      onMouseOut={() => {
        setMouseOver(false);
      }}
    >
      {meta?.thumb?.ipfs?.url ? (
        <img alt="" className="custom" src={meta.thumb.ipfs.url} />
      ) : meta?.thumb?.internal?.url ? (
        <img alt="" className="custom" src={meta.thumb.internal.url} />
      ) : meta?.thumb?.external ? (
        <img alt="" className="custom" src={meta.thumb.external} />
      ) : (
        ""
      )}
      <div className="border" />
      {busy ? <Busy /> : null}
      {popoverOpen ? (
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            top: "56px",
            left: "56px",
            width: "400px",
          }}
        >
          <NFTPopover id={token.id} meta={meta} />
        </Box>
      ) : null}
    </Thumb>
  );
};

export const NFTClaim = ({ code, onRedirect }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    onRedirect(dispatch(nft_enter_code(code)));
  }, [code, dispatch]);

  return null;
};

export const NFTContent = ({ meta, preset = "fullscreen" }) => {
  //if (p.meta?.content?.external) return null;

  const c =
    meta?.content?.internal || meta?.content?.ipfs || meta?.content?.external;

  if (!c) return null;

  const ctype = c.contentType
    ? c.contentType.indexOf("image/") !== -1
      ? "image"
      : c.contentType.indexOf("video/") !== -1
      ? "video"
      : "unknown"
    : "image";

  if (ctype === "unknown") return null;

  const url = c.url || c;

  let slib = {
    fullscreen: {
      maxW: "85vw",
      maxH: "85vh",
      mb: "5vh",
      mt: "1vh",
      w: "85vw",
      h: "auto",
      objectFit: "contain",
      borderRadius: "6px",
    },
    container: {
      w: "100%",
      objectFit: "contain",
      borderRadius: "6px",
    },
  };

  return (
    <>
      {ctype === "image" && url ? (
        <Image crossOrigin="true" src={url} alt="" {...slib[preset]} />
      ) : null}
      {ctype === "video" && url ? (
        <Box as="video" controls loop muted autoPlay {...slib[preset]}>
          <source src={url} type={c.contentType} />
        </Box>
      ) : null}
    </>
  );
};

export const NFTThumb = (p) => {
  if (p.meta?.thumb?.external) return null;

  const c =
    p.meta?.thumb?.internal || p.meta?.thumb?.ipfs || p.meta?.thumb?.external;

  if (!c) return null;

  return (
    <Thumb {...p}>
      {c.url ? <img className="custom" alt="" src={c.url} /> : ""}
      <div className="border" />
    </Thumb>
  );
};

export const NFTThumbLarge = (p) => {
  const mode = useColorModeValue("light", "dark");
  if (p.meta?.thumb?.external) return null;

  const c =
    p.meta?.thumb?.internal || p.meta?.thumb?.ipfs || p.meta?.thumb?.external;

  if (!c) return <Skeleton />;

  return (
    <ThumbLarge
      {...p}
      style={{ marginLeft: "6px" }}
      mode={mode}
      className="thumb-large"
    >
      {c.url ? <img className="custom" alt="" src={c.url} /> : ""}
      <div className="info">
        {p.meta.domain ? (
          <div className="collection">
            {p.meta.domain ? (
              p.meta.domain.indexOf("twitter.com/") !== -1 ? (
                <MetaDomainTwitter
                  key={"domain"}
                  meta={p.meta}
                  showLink={false}
                />
              ) : (
                <MetaDomain key={"domain"} meta={p.meta} showLink={false} />
              )
            ) : null}
          </div>
        ) : null}

        <div className="author">
          <div className="label">AUTHOR</div>
          <div>
            <ACC short={true}>{p.meta.author}</ACC>
          </div>
        </div>
        {p.meta.price.amount && p.meta.price.amount !== "0" ? (
          <div className="price">
            <div className="label">PRICE</div>
            <ICP digits={2}>{p.meta.price.amount}</ICP>
          </div>
        ) : null}
      </div>
    </ThumbLarge>
  );
};

const MetaDomainTwitter = ({ meta, showLink }) => {
  let url = new URL("https://" + meta.domain);
  let surl = url.href.replace(/^https?:\/\//, "");
  const dispatch = useDispatch();
  const domainInfo = useSelector((state) => state.verify[surl]);
  const isLoading = domainInfo === -1 ? true : false;
  let verified = false;
  try {
    if (!isLoading && domainInfo === meta.author) verified = true;
  } catch (e) {
    console.log(e);
  }

  useEffect(() => {
    dispatch(verify_domain_twitter(surl));
  }, [surl, dispatch]);

  let urlSafe = verified ? "https://" + surl : null;

  const [a, b, c, d] = meta.domain.split("/");

  let content = (
    <>
      {a}/{b}{" "}
      {isLoading ? (
        <Spinner size="xs" />
      ) : verified ? (
        <VerifiedIcon w={"16px"} h={"16px"} />
      ) : null}
    </>
  );

  return (
    <Box
      color={verified ? "green.300" : isLoading ? null : "red.300"}
      as={verified ? null : isLoading ? null : "s"}
    >
      {showLink && urlSafe ? (
        <a href={urlSafe} rel="noreferrer" target="_blank">
          {content}
        </a>
      ) : (
        content
      )}
    </Box>
  );
};

const MetaDomain = ({ meta, showLink }) => {
  let url = new URL("https://" + meta.domain);
  const dispatch = useDispatch();
  const domainInfo = useSelector((state) => state.verify[url.hostname]);
  const isLoading = domainInfo === -1 ? true : false;
  let verified = false;
  try {
    if (
      !isLoading &&
      typeof domainInfo === "object" &&
      domainInfo[url.pathname].indexOf(meta.author) !== -1
    )
      verified = true;
  } catch (e) {
    console.log(e);
  }

  useEffect(() => {
    dispatch(verify_domain(url.hostname));
  }, [url.hostname, dispatch]);

  let urlSafe = verified ? "https://" + url.hostname + url.pathname : null;

  let content = (
    <>
      {meta.domain}{" "}
      {isLoading ? (
        <Spinner size="xs" />
      ) : verified ? (
        <VerifiedIcon w={"16px"} h={"16px"} />
      ) : null}
    </>
  );

  return (
    <Box
      color={verified ? "green.300" : isLoading ? null : "red.300"}
      as={verified ? null : isLoading ? null : "s"}
    >
      {showLink && urlSafe ? (
        <a href={urlSafe} rel="noreferrer" target="_blank">
          {content}
        </a>
      ) : (
        content
      )}
    </Box>
  );
};

const capitalize = (x) => x.charAt(0).toUpperCase() + x.slice(1);

export const NFTInfo = ({ id, meta }) => {
  const mode = useColorModeValue("light", "dark");

  const bg = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const isDark = mode === "dark";
  if (!meta || !("quality" in meta)) return null;
  const qcolor = itemQuality[mode][meta.quality].color;
  let nowMinutes = Math.floor(Date.now() / 1000 / 60);

  let things = [
    meta.name ? (
      <Text key={"name"} color={qcolor} fontSize="16px">
        {capitalize(meta.name)}
      </Text>
    ) : null,
    meta.tags && meta.tags.length ? (
      <Wrap key={"tags"} spacing={1}>
        {meta.tags.map((a, idx) => (
          <Tag key={idx} size="sm" bg={isDark ? "gray.600" : "gray.300"}>
            {a}
          </Tag>
        ))}
      </Wrap>
    ) : null,
    meta.domain ? (
      meta.domain.indexOf("twitter.com/") !== -1 ? (
        <MetaDomainTwitter key={"domain"} meta={meta} showLink={true} />
      ) : (
        <MetaDomain key={"domain"} meta={meta} showLink={true} />
      )
    ) : null,
    "bindsForever" in meta.transfer ? (
      <Text key={"bindsForever"} fontSize="14px">
        Binds on transfer
      </Text>
    ) : null,
    "bindsDuration" in meta.transfer ? (
      <Text key={"bindsDuration"} fontSize="14px">
        Binds on transfer for{" "}
        {moment.duration(meta.transfer.bindsDuration, "minutes").humanize()}
      </Text>
    ) : null,
    meta.boundUntil > nowMinutes ? (
      <Text
        key="boundUntil"
        fontSize="14px"
        color={isDark ? "green.400" : "green.800"}
        as="i"
      >
        {"bound for " +
          moment.duration(meta.boundUntil - nowMinutes, "minutes").humanize()}
      </Text>
    ) : null,
    meta?.use?.consumable?.desc ? (
      <Text
        key="consumable"
        fontSize="14px"
        color={isDark ? "green.400" : "green.800"}
        as="i"
      >
        Use: {capitalize(meta.use.consumable.desc)} (Consumed in the process)
      </Text>
    ) : null,
    meta.cooldownUntil > nowMinutes ? (
      <Text
        key="cooldownUntil"
        fontSize="14px"
        color={isDark ? "green.400" : "green.800"}
      >
        {moment
          .duration(meta.cooldownUntil - nowMinutes, "minutes")
          .humanize() + " cooldown left"}
      </Text>
    ) : null,
    meta?.use?.cooldown?.desc ? (
      <Text
        key="cooldownDesc"
        fontSize="14px"
        color={isDark ? "green.400" : "green.800"}
      >
        Use: {capitalize(meta.use.cooldown.desc)} (
        {moment.duration(meta.use.cooldown.duration, "minutes").humanize()}{" "}
        cooldown)
      </Text>
    ) : null,
    meta?.secret ? (
      <Text
        key="secret"
        fontSize="14px"
        color={isDark ? "purple.400" : "purple.800"}
      >
        Secret
      </Text>
    ) : null,
    meta.hold?.external?.desc ? (
      <Text
        key="hold"
        fontSize="14px"
        color={isDark ? "green.400" : "green.800"}
      >
        Hold: {capitalize(meta.hold.external.desc)}
      </Text>
    ) : null,
    meta.attributes && meta.attributes.length
      ? meta.attributes.map((a, idx) => (
          <Text key={"attr" + idx} fontSize="14px">
            {a[1] >= 0 ? "+" : ""}
            {a[1]} {capitalize(a[0])}
          </Text>
        ))
      : null,
    meta.lore ? (
      <Text
        key="lore"
        fontSize="14px"
        pt="14px"
        color={isDark ? "yellow" : "yellow.600"}
      >
        "{capitalize(meta.lore)}"
      </Text>
    ) : null,
    meta.rechargeable && meta.ttl && meta.ttl > 0 ? (
      <Text
        key="ttl"
        fontSize="14px"
        pt="14px"
        color={isDark ? "gray.400" : "gray.800"}
      >
        Recharge in {moment.duration(meta.ttl, "minutes").humanize()}
      </Text>
    ) : null,
    !meta.rechargeable && meta.ttl && meta.ttl > 0 ? (
      <Text
        key="ttl"
        fontSize="14px"
        pt="14px"
        color={isDark ? "gray.400" : "gray.800"}
      >
        Expires in {moment.duration(meta.ttl, "minutes").humanize()}
      </Text>
    ) : null,
    meta.sockets && meta.sockets.length ? (
      <Wrap key="sockets" spacing={0} overflow="visible">
        {meta.sockets.map((tid, idx) => (
          <NFT token={{ id: tid }} key={tid} />
        ))}
      </Wrap>
    ) : null,
    meta.price.amount && meta.price.amount !== "0" ? (
      <Text key="icpPrice">
        <FTI id={meta.price.token} amount={meta.price.amount} />
      </Text>
    ) : null,
    id ? (
      <Flex key="footer" pt="1" pr="1" sx={{ lineHeight: "8px;" }} pb="2px">
        <NFTBattery meta={meta} />
        <Spacer />

        <Text fontSize="10px">
          <NFTA>{id}</NFTA>
        </Text>
      </Flex>
    ) : null,
  ].filter(Boolean);

  if (!things.length) return null;
  return (
    <Box
      bg={bg}
      color={textColor}
      borderRadius="md"
      w={350}
      p={2}
      sx={{ position: "relative" }}
    >
      {meta.content?.thumb?.url ? <img src={meta.content.thumb.url} /> : ""}

      <Stack spacing={0}>{things}</Stack>
    </Box>
  );
};

const NFTBatFull = styled.span`
  display: inline-block;
  background-color: ${(props) => props.color};
  width: 4px;
  margin-left: 1px;
  border-radius: 1px;
  height: 7px;
`;

export const NFTPreview = (p) => {
  return (
    <Stack spacing="5">
      <NFTContent meta={p} />
      <NFTInfo meta={p} />
      <NFTThumb meta={p} />
      <NFTThumbLarge meta={p} />
    </Stack>
  );
};

export const NFTBattery = ({ meta }) => {
  const icpCycles = Number(useSelector((state) => state.ic.oracle.icpCycles));

  const avg_msg_cost_pwr = Number(AVG_MESSAGE_COST) / icpCycles; //TODO: calculate it from oracle data
  let ttl = meta.ttl > 0 ? meta.ttl : Number(FULLY_CHARGED_MINUTES);
  let msg_full = (ttl / 60 / 24 + 100) * avg_msg_cost_pwr;
  let perc = meta.pwr[0] / msg_full;
  let avg_num_ops_left = Math.round(meta.pwr[0] / avg_msg_cost_pwr);

  let color = `rgb(${Math.floor(125 - 125 * perc)}, ${Math.floor(
    200 * perc
  )}, 255)`;
  let colorEmpty = `rgb(${Math.floor(255 - 255 * perc)}, 70, 70)`;
  return (
    <Tooltip
      hasArrow
      placement="top-start"
      label={
        <Box>
          <Text fontWeight="bold" fontSize="15px" mb="1" mt="1">
            {avg_num_ops_left + " operations left"}
          </Text>
          <Text>
            Indicator displaying PWR stored inside the NFT. Refills
            automatically on marketplace sale.
          </Text>
        </Box>
      }
    >
      <span>
        <NFTBatFull color={perc >= 0.15 ? color : colorEmpty} />
        <NFTBatFull color={perc >= 0.5 ? color : colorEmpty} />
        <NFTBatFull color={perc >= 0.75 ? color : colorEmpty} />
        <NFTBatFull color={perc >= 0.9 ? color : colorEmpty} />
      </span>
    </Tooltip>
  );
};

export const NFTProInfo = ({
  id,
  meta,
  onAuthorClick = () => {},
  onBearerClick = () => {},
}) => {
  const bg = useColorModeValue("gray.200", "gray.900");
  if (!meta || !("quality" in meta)) return null;

  let nowMinutes = Math.floor(Date.now() / 1000 / 60);

  //if (!meta.name) return null;
  return (
    <Box
      bg={bg}
      borderRadius="md"
      w={350}
      p={2}
      sx={{ wordBreak: "break-all", textTransform: "uppercase" }}
    >
      {meta.content?.thumb?.url ? <img src={meta.content.thumb.url} /> : ""}

      <Stack spacing={0}>
        {meta.pwr ? (
          <Text fontSize="9px">
            Ops: <ICP>{meta.pwr[0]}</ICP> Storage: <ICP>{meta.pwr[1]}</ICP>
          </Text>
        ) : null}
        {meta.bearer ? (
          <Text fontSize="9px">
            Bearer:{" "}
            <ACC short={true} onClick={() => onBearerClick(meta.bearer)}>
              {meta.bearer}
            </ACC>
          </Text>
        ) : null}
        {meta.author ? (
          <Text fontSize="9px" sx={{}}>
            Author:{" "}
            <ACC short={true} onClick={() => onAuthorClick(meta.author)}>
              {meta.author}
            </ACC>
          </Text>
        ) : null}
        {meta.authorShare ? (
          <Text fontSize="9px">
            Author's royalties: <b>{(meta.authorShare / 100).toFixed(2)}%</b>
          </Text>
        ) : null}
        {meta.created ? (
          <Text fontSize="9px">
            Minted: {moment(meta.created * 60 * 1000).format("LLLL")}
          </Text>
        ) : null}
        {meta.entropy ? (
          <Text fontSize="9px">
            Entropy: <HASH>{toHexString(meta.entropy)}</HASH>
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
};

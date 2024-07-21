// Copyright (c) RoochNetwork
// SPDX-License-Identifier: Apache-2.0
// Author: Jason Jo

import { LoadingButton } from "@mui/lab";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { Args, Transaction } from "@roochnetwork/rooch-sdk";
import {
  UseSignAndExecuteTransaction,
  useConnectWallet,
  useCreateSessionKey,
  useCurrentAddress,
  useCurrentSession,
  useRemoveSession,
  useRoochClientQuery,
  useWalletStore,
  useWallets,
} from "@roochnetwork/rooch-sdk-kit";
import { useState } from "react";
import "./App.css";
import { fNumber, shortAddress } from "./utils";
import CountUp from "react-countup";

function getNextRewardClick(currentClicks: number): number {
  const remainder = currentClicks % 21;
  if (remainder === 0) {
    return currentClicks + 21;
  } else {
    return currentClicks + (21 - remainder);
  }
}

// Publish address of the counter contract
const counterAddress =
  "0xe94e9b71c161b87b32bd679aebfdd0e106cd173fefc67edf178024081f33a812";

const roochCounterObject =
  "0x5047c0dd0a62cef9055cdeba7036dd267d1cfd1a4f9d3c2dcaf826ae1a54540a";

const treasuryObject =
  "0xdd0013565776613f97eb695095c640db9f9bc1fe392a9539b936d6056c66af99";

function App() {
  const wallets = useWallets();
  const currentAddress = useCurrentAddress();
  const sessionKey = useCurrentSession();
  const connectionStatus = useWalletStore((state) => state.connectionStatus);
  const setWalletDisconnected = useWalletStore(
    (state) => state.setWalletDisconnected
  );
  const { mutateAsync: connectWallet } = useConnectWallet();

  const { mutateAsync: createSessionKey } = useCreateSessionKey();
  const { mutateAsync: removeSessionKey } = useRemoveSession();
  const { mutateAsync: signAndExecuteTransaction } =
    UseSignAndExecuteTransaction();
  // const { data, refetch } = useRoochClientQuery("executeViewFunction", {
  //   target: `${counterAddress}::clicker::value`,
  // });

  const { data, refetch } = useRoochClientQuery(
    "queryObjectStates",
    {
      filter: { object_id: roochCounterObject },
      queryOption: {
        decode: true,
      },
    },
    { refetchInterval: 3000 }
  );

  const { data: RCCBalance, refetch: refetchRCCBalance } = useRoochClientQuery(
    "getBalance",
    {
      owner: currentAddress?.genRoochAddress().toStr() || "",
      coinType:
        "0xe94e9b71c161b87b32bd679aebfdd0e106cd173fefc67edf178024081f33a812::rooch_clicker_coin::RCC",
    }
  );
  console.log("🚀 ~ file: App.tsx:78 ~ App ~ RCCBalance:", RCCBalance);

  const [sessionLoading, setSessionLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const handlerCreateSessionKey = async () => {
    if (sessionLoading) {
      return;
    }
    setSessionLoading(true);

    const defaultScopes = [`${counterAddress}::*::*`];
    createSessionKey(
      {
        appName: "rooch_clicker",
        appUrl: "http://localhost:5173",
        maxInactiveInterval: 3600,
        scopes: defaultScopes,
      },
      {
        onSuccess: (result) => {
          console.log("session key", result);
        },
        onError: (why) => {
          console.log(why);
        },
      }
    ).finally(() => setSessionLoading(false));
  };

  return (
    <Stack
      className="font-sans min-w-[1024px]"
      direction="column"
      sx={{
        minHeight: "calc(100vh - 4rem)",
      }}
    >
      <Stack justifyContent="space-between" className="w-full">
        <img src="./rooch_black_combine.svg" width="120px" alt="" />
        <Stack spacing={1} justifyItems="flex-end">
          <Chip
            label="Rooch Testnet"
            variant="filled"
            className="font-semibold !bg-slate-950 !text-slate-50 min-h-10"
          />
          <Button
            variant="outlined"
            onClick={async () => {
              if (connectionStatus === "connected") {
                setWalletDisconnected();
                return;
              }
              await connectWallet({ wallet: wallets[0] });
            }}
          >
            {connectionStatus === "connected"
              ? shortAddress(currentAddress?.genRoochAddress().toStr(), 8, 6)
              : "Connect Wallet"}
          </Button>
        </Stack>
      </Stack>
      <Stack className="w-full" justifyContent="space-between">
        <Typography className="text-4xl font-semibold mt-6 text-left w-full mb-4">
          Rooch Clicker |{" "}
          {RCCBalance && (
            <span className="text-2xl">
              Balance: {fNumber(RCCBalance.balance.toString())}
              RCC <span className="text-xs ml-2">( Rooch Clicker Coin )</span>
            </span>
          )}
        </Typography>{" "}
        <Stack className="w-1/3" justifyContent="flex-end">
          {!sessionKey ? (
            <LoadingButton
              loading={sessionLoading}
              variant="contained"
              className="!mt-4"
              disabled={connectionStatus !== "connected"}
              onClick={() => {
                handlerCreateSessionKey();
              }}
            >
              {connectionStatus !== "connected"
                ? "Please connect wallet first"
                : "Create"}
            </LoadingButton>
          ) : (
            <Button
              variant="contained"
              className="!mt-4"
              // size="small"
              onClick={() => {
                removeSessionKey({ authKey: sessionKey.getAuthKey() });
              }}
            >
              Clear Session
            </Button>
          )}
        </Stack>
      </Stack>
      <Divider className="w-full" />
      <Stack
        className="mt-4 w-full font-medium "
        direction="column"
        alignItems="center"
      >
        {/* <Typography className="text-3xl font-bold">
          Rooch Clicker
          <span className="text-base font-normal ml-4">({counterAddress})</span>
        </Typography> */}
        <Stack
          // className="mt-"
          spacing={1}
          direction="column"
          alignItems="center"
        >
          <Stack spacing={2} className="text-xl">
            <Typography>Join our Click Challenge!</Typography>
            <Typography>
              Every time you hit a multiple of{" "}
              <span className="font-semibold">21</span>,
            </Typography>
            <Typography>You're in for 1,000 RCC!</Typography>
          </Stack>
          <Typography className="text-base !mt-4">
            Global Clicker Counter:{" "}
          </Typography>
          <Typography className="text-base">
            Next Bonus Click:{" "}
            {getNextRewardClick(
              Number(
                data?.data[0].decoded_value?.value.global_click_count.toString()
              )
            )}{" "}
          </Typography>
          <Typography
            className="tracking-wide font-black"
            sx={{
              fontSize: "360px",
            }}
          >
            <CountUp
              style={{
                fontVariantNumeric: "tabular-nums lining-nums",
              }}
              preserveValue
              duration={3}
              decimal=","
              end={Number(
                data?.data[0].decoded_value?.value.global_click_count.toString() ||
                  0
              )}
            />
          </Typography>
          <LoadingButton
            loading={txnLoading}
            variant="contained"
            className="w-32"
            // fullWidth
            disabled={!sessionKey}
            onClick={async () => {
              try {
                setTxnLoading(true);
                const txn = new Transaction();
                txn.callFunction({
                  address: counterAddress,
                  module: "clicker",
                  function: "click",
                  args: [
                    // rooch counter
                    Args.objectId(roochCounterObject),
                    // treasury
                    Args.objectId(treasuryObject),
                  ],
                });
                await signAndExecuteTransaction({ transaction: txn });
                await Promise.all([refetch(), refetchRCCBalance()]);
              } catch (error) {
                console.error(String(error));
              } finally {
                setTxnLoading(false);
              }
            }}
          >
            {sessionKey ? "Click!!!" : "Please create Session Key first"}
          </LoadingButton>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default App;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) RoochNetwork
// SPDX-License-Identifier: Apache-2.0
// Author: Jason Jo

import { LoadingButton } from "@mui/lab";
import { Button, Chip, Drawer, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
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
import CountUp from "react-countup";
import "./App.css";
import { fNumber, shortAddress } from "./utils";

function getNextRewardClick(currentClicks: number): number {
  const remainder = currentClicks % 21;
  if (remainder === 0) {
    return currentClicks + 21;
  } else {
    return currentClicks + (21 - remainder);
  }
}

const drawerWidth = 300;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  alignItems: "center",
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `${open ? drawerWidth : "0"}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    // marginLeft: 0,
  }),
}));

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

  const { data: coinOwnerList } = useRoochClientQuery(
    "queryObjectStates",
    {
      filter: {
        object_type:
          "0x3::coin_store::CoinStore<0xe94e9b71c161b87b32bd679aebfdd0e106cd173fefc67edf178024081f33a812::rooch_clicker_coin::RCC>",
      },
      queryOption: {
        decode: true,
        descending: false,
      },
    },
    { refetchInterval: 3000 }
  );
  console.log("🚀 ~ file: App.tsx:100 ~ App ~ coinOwnerList:", coinOwnerList);

  const [showLeaderboard, setShowLeaderboard] = useState(false);

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
              ? shortAddress(currentAddress?.toStr(), 8, 6)
              : "Connect Wallet"}
          </Button>
        </Stack>
      </Stack>
      <Stack className="w-full" justifyContent="space-between">
        <Stack>
          <Typography className="text-4xl font-semibold mt-6 text-left w-full mb-4">
            Rooch Clicker |{" "}
            {RCCBalance && (
              <span className="text-2xl">
                Balance: {fNumber(RCCBalance.balance.toString())}
                RCC <span className="text-xs ml-2">( Rooch Clicker Coin )</span>
              </span>
            )}
          </Typography>
        </Stack>{" "}
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
                : "Create Session Key"}
            </LoadingButton>
          ) : (
            <Button
              variant="contained"
              className="!mt-4"
              onClick={() => {
                removeSessionKey({ authKey: sessionKey.getAuthKey() });
              }}
            >
              Clear Session Key
            </Button>
          )}
        </Stack>
      </Stack>
      <Stack
        className="mt-4 w-full font-medium "
        direction="column"
        alignItems="center"
      >
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              marginTop: "168px",
              height: "calc(100% - 168px)",
              background: "transparent",
              p: 2,
            },
          }}
          variant="persistent"
          anchor="left"
          open={showLeaderboard}
        >
          <Stack>
            <Typography className="text-xl font-semibold">
              Leaderboard
            </Typography>
          </Stack>
          <Stack direction="column" className="mt-4" spacing={1.5}>
            {coinOwnerList?.data
              .filter(
                (i) =>
                  i.owner !==
                  "rooch1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhxqaen"
              )
              .sort((a, b) => {
                return (
                  Number((b.decoded_value?.value.balance as any).value.value) -
                  Number((a.decoded_value?.value.balance as any).value.value)
                );
              })
              .map((i) => {
                return (
                  <Stack
                    className="w-full"
                    justifyContent="space-between"
                    sx={{
                      fontWeight:
                        i.owner === currentAddress?.genRoochAddress().toStr()
                          ? 700
                          : 500,
                    }}
                  >
                    <Typography>
                      {shortAddress(i.owner_bitcoin_address, 6, 6)}
                    </Typography>
                    <Typography
                      style={{
                        fontVariantNumeric: "tabular-nums lining-nums",
                      }}
                    >
                      {fNumber(
                        Number(
                          (i.decoded_value?.value.balance as any).value.value
                        )
                      )}
                    </Typography>
                  </Stack>
                );
              })}
          </Stack>
        </Drawer>
        <Main open={showLeaderboard}>
          <Stack
            spacing={2}
            className="text-xl w-full text-center items-center justify-center"
          >
            <Typography>Join our Click Challenge!</Typography>
            <Typography>
              Every time you hit a multiple of{" "}
              <span className="font-semibold">21</span>,
            </Typography>
            <Typography>You're in for 1,000 RCC!</Typography>
          </Stack>
          <Button
            className="!mt-4"
            onClick={() => {
              setShowLeaderboard(!showLeaderboard);
            }}
            variant="outlined"
          >
            Leaderboard
          </Button>
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
            onClick={async () => {
              if (!sessionKey) {
                return;
              }
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
            <CountUp
              style={{
                fontVariantNumeric: "tabular-nums lining-nums",
                userSelect: "none",
                cursor: "pointer",
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
        </Main>
      </Stack>
    </Stack>
  );
}

export default App;

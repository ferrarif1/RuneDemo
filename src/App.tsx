import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Button, Card, Input, Radio } from "antd";
import { encodeBitcoinVarIntTuple, bb26Encode } from "./utils";
import { buildRuneData } from "./coin-bitcoin/src/rune";
import { RuneTestWallet } from "./coin-bitcoin/src"; //remove
import { SignTxParams } from "@okxweb3/coin-base";
import { OPS } from "./coin-bitcoin/src/bitcoinjs-lib/ops";
import * as bscript from "./coin-bitcoin/src/bitcoinjs-lib/script";
import { Buffer } from "buffer";
import { buffer } from "stream/consumers";
//测试用
const TAG_BODY = BigInt(0);
function encodeToVec(n: bigint, payload: number[]): void {
  let i = 18;
  const out = new Array(19).fill(0);

  out[i] = Number(n & BigInt(0x7f));

  while (n > BigInt(0x7f)) {
    n = n / BigInt(128) - BigInt(1);
    i--;
    out[i] = Number(n & BigInt(0xff)) | 0x80;
  }

  payload.push(...out.slice(i));
}
//测试用

function App() {
  const [unisatInstalled, setUnisatInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  });
  const [network, setNetwork] = useState("livenet");

  //**************************************用utils的 👇 用test start 2-core-bitcoin替代test start 1，后者调用简便许多*/
  // example from: https://docs.runealpha.xyz/en/issuance-example#calculate-the-first-data-in-protocol-message
  //part1 发行rune
  //id=0代表发行 id=具体值代表转账等操作
  //1代表第一个output输出
  //21000000代表总量
  //encodeBitcoinVarIntTuple([0, 1, 21000000]) = 0001fe406f4001
  const result1 = encodeBitcoinVarIntTuple([0, 1, 21000000]);
  console.log("encodeBitcoinVarIntTuple([0, 1, 21000000]) = " + result1);

  //part2
  //bb26Encode("[RUNE, 18]") = ffdbf3de59dbf3de5912
  const bb26 = bb26Encode("rune"); //必须小写
  const result2 = encodeBitcoinVarIntTuple([bb26, 18]);
  console.log("bb26Encode[RUNE, 18] = " + result2);

  //OP_RETURN 52 0001fe406f4001 ffdbf3de59dbf3de5912
  //"52"在十进制中等于82, 82是“R”在utf-8编码的数值，代表主网
  //OP_RETURN 52 0001fe406f4001 ffdbf3de59dbf3de5912
  //**************************************用utils的 👆*/
 

  //**************************************用core-bitcoin的 👇*/
  //part1
  const opReturnScript = buildRuneData(false, [
    { id: 0x2aa16001b, output: 0, amount: 3000 },
  ]);
  console.log(opReturnScript.toString("hex")); //6a0952554e455f544553540900a9cfd6ff1b866800
  //part2
  /********* 测试*/

  /********* 测试*/
  const tt = encodeBitcoinVarIntTuple([0x2aa16001b, 0, 3000]);
  console.log("tt encodeBitcoinVarIntTuple([0x2aa16001b, 0, 3000]) = " + tt); //ff1b0016aa1b0016aa00fde803

  // const edicts = [{id: 0x2aa16001b, output: 0, amount: 1000}];
  const edicts = [{ id: 0, output: 1, amount: 21000000 }];
  let payload: number[] = [];

  if (edicts.length > 0) {
    encodeToVec(TAG_BODY, payload);

    edicts.sort((a, b) => a.id - b.id);

    let id = 0;
    for (const edict of edicts) {
      encodeToVec(BigInt(edict.id - id), payload);
      encodeToVec(BigInt(edict.amount), payload);
      encodeToVec(BigInt(edict.output), payload);
      id = edict.id;
    }
  }

  const oporiginal = [
    (OPS.OP_RETURN),
    (Buffer.from("RUNE_TEST")).toString("hex"),
    (Buffer.from(payload)).toString("hex"),
  ];
  console.log("oporiginal = "+oporiginal) //oporiginal = 106,52554e455f54455354,00008980dd4001

  const opReturnScript2 = bscript.compile([
    OPS.OP_RETURN,
    Buffer.from("RUNE_TEST"),
    Buffer.from(payload),
  ]);

  console.log(
    "should be 6a0952554e455f544553540900a9cfd6ff1b866800 compile = " +
      opReturnScript2.toString("hex")
  ); //6a0952554e455f544553540900a9cfd6ff1b866800
  //6a0952554e455f54455354 0900a9cfd6ff1b866800   6a0952554e455f544553540900a9cfd6ff1b963800
  console.log("R = " + Buffer.from("R").toString("hex")); //52
  console.log("RUNE_TEST = " + Buffer.from("RUNE_TEST").toString("hex")); //52554e455f54455354
  

  /********* 测试*/

  //这是一个rune转账交易
  let runeTxParams = {
    inputs: [
      // rune token info
      {
        txId: "4f8a6cc528669278dc33e4d824bb047121505a5e2cc53d1a51e3575c60564b73",
        vOut: 0,
        amount: 546,
        address:
          "tb1pnxu8mvv63dujgydwt0l5s0ly8lmgmef3355x4t7s2n568k5cryxqfk78kq",
        data: [{ id: "26e4140001", amount: 500 }], // maybe many rune token
      },
      // gas fee utxo
      {
        txId: "4f8a6cc528669278dc33e4d824bb047121505a5e2cc53d1a51e3575c60564b73",
        vOut: 2,
        amount: 97570,
        address:
          "tb1pnxu8mvv63dujgydwt0l5s0ly8lmgmef3355x4t7s2n568k5cryxqfk78kq",
      },
    ],
    outputs: [
      {
        // rune send output
        address: "tb1q05w9mglkhylwjcntp3n3x3jaf0yrx0n7463u2h",
        amount: 546,
        data: { id: "26e4140001", amount: 100 }, // one output allow only one rune token
      },
    ],
    address: "tb1pnxu8mvv63dujgydwt0l5s0ly8lmgmef3355x4t7s2n568k5cryxqfk78kq",
    feePerB: 10,
    runeData: {
      etching: null,
      burn: false,
    },
  };

  console.info(runeTxParams);
  //**************************************用core-bitcoin的 👆*/


  //todo：
  //参考https://github.com/ferrarif1/fuckrune/blob/main/index.js
  //https://github.com/unisat-wallet/wallet-sdk/blob/master/test/transaction/transaction.test.ts
  //unisat文档https://github.com/unisat-wallet/unisat-docs/blob/ca6837a6e6fa7fa9451f53d1ac00191a10b088bb/docs/guide/unisat-api.md?plain=1#L264
  //btc opreturn交易：https://segmentfault.com/a/1190000019291453
  //1.如何把交易给到unisat完成签名
  //2.查询btc、rune余额，去官网看一下，应该有apikey申请
  //3.psbt交易上架，购买功能

  //test end 2-core-bitcoin

  const getBasicInfo = async () => {
    const unisat = (window as any).unisat;
    const [address] = await unisat.getAccounts();
    setAddress(address);

    const publicKey = await unisat.getPublicKey();
    setPublicKey(publicKey);

    const balance = await unisat.getBalance();
    setBalance({ confirmed: 99, unconfirmed: 0, total: 99 });

    const network = await unisat.getNetwork();
    setNetwork(network);
  };

  const selfRef = useRef<{ accounts: string[] }>({
    accounts: [],
  });
  const self = selfRef.current;
  const handleAccountsChanged = (_accounts: string[]) => {
    if (self.accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return;
    }
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setAccounts(_accounts);
      setConnected(true);

      setAddress(_accounts[0]);

      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const handleNetworkChanged = (network: string) => {
    setNetwork(network);
    getBasicInfo();
  };

  useEffect(() => {
    async function checkUnisat() {
      let unisat = (window as any).unisat;

      for (let i = 1; i < 10 && !unisat; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i));
        unisat = (window as any).unisat;
      }

      if (unisat) {
        setUnisatInstalled(true);
      } else if (!unisat) return;

      unisat.getAccounts().then((accounts: string[]) => {
        handleAccountsChanged(accounts);
      });

      unisat.on("accountsChanged", handleAccountsChanged);
      unisat.on("networkChanged", handleNetworkChanged);

      return () => {
        unisat.removeListener("accountsChanged", handleAccountsChanged);
        unisat.removeListener("networkChanged", handleNetworkChanged);
      };
    }

    checkUnisat().then();
  }, []);

  if (!unisatInstalled) {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <Button
              onClick={() => {
                window.location.href = "https://unisat.io";
              }}
            >
              Install Unisat Wallet
            </Button>
          </div>
        </header>
      </div>
    );
  }
  const unisat = (window as any).unisat;
  return (
    <div className="App">
      <header className="App-header">
        <p>Unisat Wallet Demo</p>

        {connected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Card
              size="small"
              title="Basic Info"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Address:</div>
                <div style={{ wordWrap: "break-word" }}>{address}</div>
              </div>

              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>PublicKey:</div>
                <div style={{ wordWrap: "break-word" }}>{publicKey}</div>
              </div>

              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Balance: (Satoshis)</div>
                <div style={{ wordWrap: "break-word" }}>{balance.total}</div>
              </div>
            </Card>

            <Card
              size="small"
              title="Switch Network"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Network:</div>
                <Radio.Group
                  onChange={async (e) => {
                    const network = await unisat.switchNetwork(e.target.value);
                    setNetwork(network);
                  }}
                  value={network}
                >
                  <Radio value={"livenet"}>livenet</Radio>
                  <Radio value={"testnet"}>testnet</Radio>
                </Radio.Group>
              </div>
            </Card>

            <SignPsbtCard />
            <SignMessageCard />
            <PushTxCard />
            <PushPsbtCard />
            <SendBitcoin />
          </div>
        ) : (
          <div>
            <Button
              onClick={async () => {
                const result = await unisat.requestAccounts();
                handleAccountsChanged(result);
              }}
            >
              Connect Unisat Wallet
            </Button>
          </div>
        )}
      </header>
    </div>
  );
}
// PSBT（Partially Signed Bitcoin Transaction，部分签名的比特币交易）是一种比特币交易的格式，
// 允许在交易最终提交到区块链之前，由多方分别签名。
// rune符文交易分为上架（list）、购买（buy）两部分，分别由卖家和买家对交易进行签名，当两个签名都具备时，广播这笔交易即可完成购买
function SignPsbtCard() {
  const [psbtHex, setPsbtHex] = useState("");
  const [psbtResult, setPsbtResult] = useState("");
  return (
    <Card size="small" title="Sign Psbt" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>PsbtHex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Result:</div>
        <div style={{ wordWrap: "break-word" }}>{psbtResult}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const psbtResult = await (window as any).unisat.signPsbt(psbtHex);
            setPsbtResult(psbtResult);
          } catch (e) {
            setPsbtResult((e as any).message);
          }
        }}
      >
        Sign Psbt
      </Button>
    </Card>
  );
}

function SignMessageCard() {
  const [message, setMessage] = useState("hello world~");
  const [signature, setSignature] = useState("");
  return (
    <Card size="small" title="Sign Message" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Message:</div>
        <Input
          defaultValue={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Signature:</div>
        <div style={{ wordWrap: "break-word" }}>{signature}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          const signature = await (window as any).unisat.signMessage(message);
          setSignature(signature);
        }}
      >
        Sign Message
      </Button>
    </Card>
  );
}

function PushTxCard() {
  const [rawtx, setRawtx] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card
      size="small"
      title="Push Transaction Hex"
      style={{ width: 300, margin: 10 }}
    >
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>rawtx:</div>
        <Input
          defaultValue={rawtx}
          onChange={(e) => {
            setRawtx(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.pushTx(rawtx);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        PushTx
      </Button>
    </Card>
  );
}
//----------------------------------------------------------------
//购买
function PushPsbtCard() {
  const [psbtHex, setPsbtHex] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card size="small" title="Push Psbt Hex" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>psbt hex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.pushPsbt(psbtHex);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        pushPsbt
      </Button>
    </Card>
  );
}

function SendBitcoin() {
  const [toAddress, setToAddress] = useState(
    "tb1qmfla5j7cpdvmswtruldgvjvk87yrflrfsf6hh0"
  );
  const [satoshis, setSatoshis] = useState(10);
  const [txid, setTxid] = useState("");
  return (
    <Card size="small" title="Send Bitcoin" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
          }}
        ></Input>
      </div>

      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Amount: (satoshis)</div>
        <Input
          defaultValue={satoshis}
          onChange={(e) => {
            setSatoshis(parseInt(e.target.value));
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            /*
            # UniSat Wallet Release Notes
            ## v1.2.8
            The unisat.sendBitcoin method has added a memo parameter, increasing OP_RETURN output when sending btc.
            https://github.com/unisat-wallet/extension/blob/ea174e81ff8b13c0bd4a4b4dc1baeb48b08d6c1b/src/content-script/pageProvider/index.ts#L237
            sendBitcoin = async (toAddress: string, satoshis: number, options?: { feeRate: number; memo?: string }) => {
              return this._request({
                method: 'sendBitcoin',
                params: {
                  toAddress,
                  satoshis,
                  feeRate: options?.feeRate,
                  memo: options?.memo,
                  type: TxType.SEND_BITCOIN
                }
              });
            };

            
            rune transfer example:https://mempool.space/testnet/tx/9edf897ad90b15b681d0c466d9e4f83c32a60fae21ee1f90313280b86a10dd89
            */
            //发行：
            //主网R（官网文档的示例）：          OP_RETURN 52 0001fe406f4001 ffdbf3de59dbf3de5912
            //测试网RUNE_TEST：OP_RETURN 52554e455f54455354 0001fe406f4001 ffdbf3de59dbf3de5912
            //转账：52554e455f54455354 09 0083ed9fceff016401
            //6a0952554e455f544553540900a9cfd6ff1b866800
            const opscript = "52554e455f54455354 0083ed9fceff016401"; //52554e455f54455354ff1b0016aa1b0016aa00fde803 这是RUNE_TEST的encodeBitcoinVarIntTuple[0x2aa16001b, 0, 1000]结果
         
            const hexString = "52554e455f544553540900a9cfd6ff1b866800";
            const hexBytesArray: string[] = [];

            // Loop through the hex string, taking 2 characters at a time
            for (let i = 0; i < hexString.length; i += 2) {
              hexBytesArray.push(hexString.substring(i, i + 2));
            }

            console.log(hexBytesArray);
            const options = { memo: hexBytesArray};
            const txid = await (window as any).unisat.sendBitcoin(
              toAddress,
              satoshis,
              options
            );
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        SendBitcoin
      </Button>
    </Card>
  );
}

export default App;

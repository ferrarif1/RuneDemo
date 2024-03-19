import React, { useEffect, useRef, useState } from 'react'
import './App.css'
import { Button, Card, Input, Radio } from 'antd'
import {
  encodeBitcoinVarIntTuple,
  bb26Encode
} from './utils'

function App() {
  const [unisatInstalled, setUnisatInstalled] = useState(false)
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState<string[]>([])
  const [publicKey, setPublicKey] = useState('')
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  })
  const [network, setNetwork] = useState('livenet')


  // example from: https://docs.runealpha.xyz/en/issuance-example#calculate-the-first-data-in-protocol-message
  //part1
  //encodeBitcoinVarIntTuple([0, 1, 21000000]) = 0001fe406f4001
  const result1 = encodeBitcoinVarIntTuple([0, 1, 21000000])
  console.log('encodeBitcoinVarIntTuple([0, 1, 21000000]) = ' + result1)

  //part2
  //bb26Encode("[RUNE, 18]") = ffdbf3de59dbf3de5912
  const bb26 = bb26Encode('rune') //必须小写
  const result2 = encodeBitcoinVarIntTuple([bb26, 18])
  console.log('bb26Encode[RUNE, 18] = ' + result2)
 
  //OP_RETURN 52 0001fe406f4001 ffdbf3de59dbf3de5912
  //part 3 拼接OP_return
  //Last result  of Protocol message
  //OP_RETURN 52 0001fe406f4001 ffdbf3de59dbf3de5912



  const getBasicInfo = async () => {
    const unisat = (window as any).unisat
    const [address] = await unisat.getAccounts()
    setAddress(address)

    const publicKey = await unisat.getPublicKey()
    setPublicKey(publicKey)

    const balance = await unisat.getBalance()
    setBalance(balance)

    const network = await unisat.getNetwork()
    setNetwork(network)
  }

  const selfRef = useRef<{ accounts: string[] }>({
    accounts: [],
  })
  const self = selfRef.current
  const handleAccountsChanged = (_accounts: string[]) => {
    if (self.accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return
    }
    self.accounts = _accounts
    if (_accounts.length > 0) {
      setAccounts(_accounts)
      setConnected(true)

      setAddress(_accounts[0])

      getBasicInfo()
    } else {
      setConnected(false)
    }
  }

  const handleNetworkChanged = (network: string) => {
    setNetwork(network)
    getBasicInfo()
  }

  useEffect(() => {
    async function checkUnisat() {
      let unisat = (window as any).unisat

      for (let i = 1; i < 10 && !unisat; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i))
        unisat = (window as any).unisat
      }

      if (unisat) {
        setUnisatInstalled(true)
      } else if (!unisat) return

      unisat.getAccounts().then((accounts: string[]) => {
        handleAccountsChanged(accounts)
      })

      unisat.on('accountsChanged', handleAccountsChanged)
      unisat.on('networkChanged', handleNetworkChanged)

      return () => {
        unisat.removeListener('accountsChanged', handleAccountsChanged)
        unisat.removeListener('networkChanged', handleNetworkChanged)
      }
    }

    checkUnisat().then()
  }, [])

  if (!unisatInstalled) {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <Button
              onClick={() => {
                window.location.href = 'https://unisat.io'
              }}
            >
              Install Unisat Wallet
            </Button>
          </div>
        </header>
      </div>
    )
  }
  const unisat = (window as any).unisat
  return (
    <div className="App">
      <header className="App-header">
        <p>Unisat Wallet Demo</p>

        {connected ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Card
              size="small"
              title="Basic Info"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>Address:</div>
                <div style={{ wordWrap: 'break-word' }}>{address}</div>
              </div>

              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>PublicKey:</div>
                <div style={{ wordWrap: 'break-word' }}>{publicKey}</div>
              </div>

              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>Balance: (Satoshis)</div>
                <div style={{ wordWrap: 'break-word' }}>{balance.total}</div>
              </div>
            </Card>

            <Card
              size="small"
              title="Switch Network"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>Network:</div>
                <Radio.Group
                  onChange={async (e) => {
                    const network = await unisat.switchNetwork(e.target.value)
                    setNetwork(network)
                  }}
                  value={network}
                >
                  <Radio value={'livenet'}>livenet</Radio>
                  <Radio value={'testnet'}>testnet</Radio>
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
                const result = await unisat.requestAccounts()
                handleAccountsChanged(result)
              }}
            >
              Connect Unisat Wallet
            </Button>
          </div>
        )}
      </header>
    </div>
  )
}
// PSBT（Partially Signed Bitcoin Transaction，部分签名的比特币交易）是一种比特币交易的格式，
// 允许在交易最终提交到区块链之前，由多方分别签名。
// rune符文交易分为上架（list）、购买（buy）两部分，分别由卖家和买家对交易进行签名，当两个签名都具备时，广播这笔交易即可完成购买
function SignPsbtCard() {
  const [psbtHex, setPsbtHex] = useState('')
  const [psbtResult, setPsbtResult] = useState('')
  return (
    <Card size="small" title="Sign Psbt" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>PsbtHex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value)
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Result:</div>
        <div style={{ wordWrap: 'break-word' }}>{psbtResult}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const psbtResult = await (window as any).unisat.signPsbt(psbtHex)
            setPsbtResult(psbtResult)
          } catch (e) {
            setPsbtResult((e as any).message)
          }
        }}
      >
        Sign Psbt
      </Button>
    </Card>
  )
}

function SignMessageCard() {
  const [message, setMessage] = useState('hello world~')
  const [signature, setSignature] = useState('')
  return (
    <Card size="small" title="Sign Message" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Message:</div>
        <Input
          defaultValue={message}
          onChange={(e) => {
            setMessage(e.target.value)
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Signature:</div>
        <div style={{ wordWrap: 'break-word' }}>{signature}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          const signature = await (window as any).unisat.signMessage(message)
          setSignature(signature)
        }}
      >
        Sign Message
      </Button>
    </Card>
  )
}

function PushTxCard() {
  const [rawtx, setRawtx] = useState('')
  const [txid, setTxid] = useState('')
  return (
    <Card
      size="small"
      title="Push Transaction Hex"
      style={{ width: 300, margin: 10 }}
    >
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>rawtx:</div>
        <Input
          defaultValue={rawtx}
          onChange={(e) => {
            setRawtx(e.target.value)
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>txid:</div>
        <div style={{ wordWrap: 'break-word' }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.pushTx(rawtx)
            setTxid(txid)
          } catch (e) {
            setTxid((e as any).message)
          }
        }}
      >
        PushTx
      </Button>
    </Card>
  )
}
//----------------------------------------------------------------
//购买
function PushPsbtCard() {
  const [psbtHex, setPsbtHex] = useState('')
  const [txid, setTxid] = useState('')
  return (
    <Card size="small" title="Push Psbt Hex" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>psbt hex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value)
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>txid:</div>
        <div style={{ wordWrap: 'break-word' }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.pushPsbt(psbtHex)
            setTxid(txid)
          } catch (e) {
            setTxid((e as any).message)
          }
        }}
      >
        pushPsbt
      </Button>
    </Card>
  )
}

function SendBitcoin() {
  const [toAddress, setToAddress] = useState(
    'tb1qmfla5j7cpdvmswtruldgvjvk87yrflrfsf6hh0',
  )
  const [satoshis, setSatoshis] = useState(1000)
  const [txid, setTxid] = useState('')
  return (
    <Card size="small" title="Send Bitcoin" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value)
          }}
        ></Input>
      </div>

      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Amount: (satoshis)</div>
        <Input
          defaultValue={satoshis}
          onChange={(e) => {
            setSatoshis(parseInt(e.target.value))
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>txid:</div>
        <div style={{ wordWrap: 'break-word' }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.sendBitcoin(
              toAddress,
              satoshis,
            )
            setTxid(txid)
          } catch (e) {
            setTxid((e as any).message)
          }
        }}
      >
        SendBitcoin
      </Button>
    </Card>
  )
}

export default App

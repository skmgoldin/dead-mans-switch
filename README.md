# Dead Man's Switch

[ ![Codeship Status for skmgoldin/dead-mans-switch](https://app.codeship.com/projects/055a3890-97ed-0135-6eb6-6ebb5ac2ea05/status?branch=master)](https://app.codeship.com/projects/251961)

A smart contract for managing cryptoassets after shrugging off your mortal coil.

## How it works

Deposit ERC-20 tokens using the deposit function. As the dead man, you must invoke the `heartbeat` function every heartbeatPeriod or you will be assumed dead and your beneficiaries will be allowed to withdraw your cryptoassets.

## Install

`npm i && npm run compile`

## Test

`npm run test`

## Deploy

Deploying to a network other than the testRPC requires a `secrets.json` file with a mnemonic whose account on the `m/44'/60'/0'/0` path is funded with Ether for the network being deployed to.

The `secrets.json` file should be in the following form:
```
{
  "mnemonic": "my very good mnemonic"
}
```

Rinkeby: `npm run deploy-rinkeby`


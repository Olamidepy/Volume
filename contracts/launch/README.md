# Submitting Volume (V6) to Programmable

Volume launches on **Ethereum mainnet** as a Programmable **Custom Launch**, using Programmable's own
**protected launch contracts** (token, hook, initializer and fee vaults) from their verified
`@programmable/launch` 4.1.7 release. This is the same package Neutrino launched with. Programmable refuses
hand-written hooks while launch protection is required, so the contracts are theirs, unmodified, with Volume's
settings bound in.

`protected-eth.mjs` prepares the request. It never signs or sends a transaction. After Programmable approves,
the dev wallet signs on programmable.market.

## What Volume launches with

All of these are in `volume.launch.json`.

| Setting | Value |
| --- | --- |
| Token | Volume (V6). 1,000,000,000 supply. No mint, owner or upgrade. |
| Fees | **5% on every buy and sell:** 4.7% creator fee to the dev wallet and 0.3% to Programmable. Fixed for good. |
| Burn and buyback | None. The creator fee is paid to the dev wallet. |
| Starting value | $17,500 FDV (`targetFdvUsd`), priced from the onchain Chainlink ETH/USD feed at build time |
| Liquidity | The whole supply is locked in the pool for good |
| First buy | $2 of ETH (`initialBuyUsd`) to the dev wallet, in the launch transaction |
| Launch protection (fixed by Programmable) | For the first 300 s every wallet is capped at 2% of supply. For the first 30 s buy fees start at 99% and fall to normal; the extra goes to Programmable. The dev wallet skips the extra fee but is still capped. |
| Dev wallet | `0x2C3463D9C8e0d5E34C058fE09B127Bb055Ae591E`: controller, creator fee recipient and first-buy recipient |

## Before you start

- **API key:** a Programmable API key for **Ethereum** with `custom-launch:create` and `custom-launch:read`, bound to the dev wallet.
- **Logo URL:** `https://www.volumeprogrammable.xyz/volume-logo.png` must open in a browser. Finish the DNS setup first.
- **A public GitHub repo** for the contract sources (step 2). Programmable reads the sources from it.
- **ETH in the dev wallet** for the first buy and the launch gas.

## Run it (Ubuntu / WSL)

```bash
cd /mnt/c/Users/ACER/Volume/contracts
bash launch/setup.sh                        # 1. downloads and verifies Programmable's release; must print OK
node launch/protected-eth.mjs prepare       # 2. writes the contract sources to launch/project
```

Publish `launch/project` as a **public** repo (create an empty one on GitHub first, for example `volume-launch`):

```bash
cd launch/project
git init -b main && git add -A && git commit -m "Volume (V6) launch sources"
git remote add origin https://github.com/<you>/volume-launch.git
git push -u origin main
cd ../..
```

Then build and submit:

```bash
node launch/protected-eth.mjs build         # 3. builds the request and prints the token and hook addresses
read -rsp "Programmable API key: " PROGRAMMABLE_API_KEY; export PROGRAMMABLE_API_KEY; echo
node launch/protected-eth.mjs preflight     # 4. Programmable checks the request; nothing is created
node launch/protected-eth.mjs submit        # 5. creates the launch for review; prints the launch ID
```

- **Node:** Node 24 (`nvm install 24`). The release declares Node 24.14 or newer.
- **RPC:** the build reads Ethereum through `https://ethereum-rpc.publicnode.com`. Set `ETHEREUM_RPC_URL` to use another.
- **API key:** `read -rs` keeps the key out of your shell history. Never paste the key into chat.
- **Don't edit `launch/project`.** The files must match Programmable's release byte for byte.

## If it stops

This script has not been run against Programmable's live API yet, so the first run may stop with a message.
Nothing is signed or sent when it does.

- **Any "stopped" or "blockers" message:** copy the terminal output, and `launch/out/preflight.json` if it exists, to Claude. Neither contains secrets.
- **"A newer @programmable/launch release is needed":** Programmable changed its rules since 4.1.7. Tell Claude.
- **Request expired:** a built request is valid for 23 hours. Run `build` again.

## After approval

1. Open the launch in "Your launches" on programmable.market with the dev wallet and sign.
2. Put the token and hook addresses from `launch/out/summary.json` into `src/lib/site.ts` (`contract` and `hook`), then redeploy the site.

## Not done yet

- **Audit:** the protected contracts are Programmable's reviewed package, but this is not an independent audit of them.
- **Live fee policy:** `build` prints Programmable's current trade fee policy. If it isn't 30 bps, read the preflight result before submitting.

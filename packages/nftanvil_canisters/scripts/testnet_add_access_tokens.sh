#!/bin/bash
echo "dfx canister --wallet=$(dfx identity --network ic get-wallet) --network ic call zhhlp-riaaa-aaaai-qa24q-cai addTokens '(\"$1\", $2:nat)' "

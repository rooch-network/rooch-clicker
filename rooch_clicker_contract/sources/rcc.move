// Copyright (c) RoochNetwork
// SPDX-License-Identifier: Apache-2.0

module rooch_clicker::rooch_clicker_coin {

    use std::string;
    use std::option;
    use moveos_std::object::{Self, Object};
    use rooch_framework::coin;
    use rooch_framework::coin_store::{Self, CoinStore};
    use rooch_framework::account_coin_store;

    friend rooch_clicker::clicker;
    const TOTAL_SUPPLY: u256 = 210_000_000_000u256;
    const DECIMALS: u8 = 0u8;

    struct RCC has key, store {}

    struct Treasury has key {
        coin_store: Object<CoinStore<RCC>>
    }

    fun init() {
        let coin_info_obj = coin::register_extend<RCC>(
            string::utf8(b"Rooch Clicker Coin"),
            string::utf8(b"RCC"),
            option::none(),
            DECIMALS,
        );
        // Mint the total supply of coins, and store it to the treasury
        let coin = coin::mint_extend<RCC>(&mut coin_info_obj, TOTAL_SUPPLY);
        // Frozen the CoinInfo object, so that no more coins can be minted
        object::to_frozen(coin_info_obj);
        let coin_store_obj = coin_store::create_coin_store<RCC>();
        coin_store::deposit(&mut coin_store_obj, coin);
        let treasury_obj = object::new_named_object(Treasury { coin_store: coin_store_obj });
        // Make the treasury object to shared, so anyone can get mutable Treasury object
        object::to_shared(treasury_obj);
    }

    /// Provide a faucet to give out coins to users
    /// In a real world scenario, the coins should be given out in the application business logic.
    public(friend) fun internel_mint(recipient: address, amount: u256, treasury_obj: &mut Object<Treasury>) {
        let treasury = object::borrow_mut(treasury_obj);
        let coin = coin_store::withdraw(&mut treasury.coin_store, amount);
        account_coin_store::deposit(recipient, coin);
    }
}
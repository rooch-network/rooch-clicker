// Copyright (c) RoochNetwork
// SPDX-License-Identifier: Apache-2.0

module rooch_clicker::clicker {
    use moveos_std::signer;
    use moveos_std::object::{Self, Object};

    use rooch_clicker::rooch_clicker_coin::{Self,Treasury};

    struct RoochCounter has key {
        global_click_count: u64
    }
    fun init() {
        let rooch_counter_obj = object::new_named_object(RoochCounter { global_click_count: 0 });
        object::to_shared(rooch_counter_obj);
    }
    entry fun click(account: &signer, rooch_counter_obj: &mut Object<RoochCounter>, treasury_obj: &mut Object<Treasury>) {
        let rooch_counter = object::borrow_mut(rooch_counter_obj);
        let recipient_addr = signer::address_of(account);
        let amount = 1u256;
        if ((rooch_counter.global_click_count + 1) % 21 == 0) {
          amount = 1000u256
        };
        rooch_clicker_coin::internel_mint(recipient_addr, amount, treasury_obj);
        rooch_counter.global_click_count = rooch_counter.global_click_count + 1;
    }

}
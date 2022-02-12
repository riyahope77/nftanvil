import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Router "./router_interface";
import Nft "./nft_interface";
import Pwr "./pwr_interface";
import Treasury "./treasury_interface";
import History "./history_interface";
import Anv "./anv_interface";
import Account "./account_interface";
import Ledger "./ledger_interface";
import Float "mo:base/Float";
import Int64 "mo:base/Int64";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Array_ "../lib/Array";

module {
    public type CanisterSlot = Nft.CanisterSlot;
    public type CanisterRange = Nft.CanisterRange;
    public type Oracle = Nft.Oracle;

    public let MGR_MIN_INACTIVE_CAN_CYCLES = 100_000_000_000;
    public let MGR_MIN_ACTIVE_CAN_CYCLES = 300_000_000_000;
    public let MGR_IGNORE_CYCLES = 1_000_000_000;

    public type Config = {
        router: Principal;

        nft: CanisterRange;
        nft_avail: [CanisterSlot];
        account: CanisterRange;
        pwr: CanisterSlot;
        anv: CanisterSlot;
        treasury: CanisterSlot;
        history: CanisterSlot;
        history_range: CanisterRange;
        space:[[Nat64]];
    };

    public module Config = {
        public func default() : Config {
            {
                router = Principal.fromText("aaaaa-aa");
                nft = (0,5000);
                nft_avail = [];
                account = (5010,5013);
                pwr = 5002;
                anv = 5003;
                treasury = 5004;
                history = 5100;
                history_range = (5100,5500);
                space = [[17830671, 17836454]]
            };
        };
    };
    
    public type CommonActor =  actor {
            config_set   : shared (conf : Config) -> async ();
            oracle_set   : shared (oracle : Oracle) -> async ();
            wallet_receive : shared () -> async ();
        };

    public module Oracle = {
        public func default() : Oracle {
            {
                icpCycles = 160000; // e8s to cycles
                icpFee = 10000; 
                pwrFee = 10000;
                anvFee = 10000;
            }
        };
        public func cycle_to_pwr(oracle:Oracle, cycles:Nat64) : Nat64 {
             cycles / oracle.icpCycles
        };
    };

    public func router(conf : Config) : Router.Interface {
        actor(Principal.toText(conf.router)) : Router.Interface;
    };

    // public func collection(conf : Config) : Collection.Interface {
    //     actor(Principal.toText(conf.collection)) : Collection.Interface;
    // };
   
    public func treasury(conf : Config) : Treasury.Interface {
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, conf.treasury))) : Treasury.Interface;
    };

    public func treasury_address(conf : Config) : Nft.AccountIdentifier {
        Nft.AccountIdentifier.fromPrincipal(Nft.APrincipal.fromSlot(conf.space, conf.treasury), null);
    };

    public func nft_address(conf : Config, slot : CanisterSlot) : Nft.AccountIdentifier {
        Nft.AccountIdentifier.fromPrincipal(Nft.APrincipal.fromSlot(conf.space, slot), null);
    };

    public func anv(conf : Config) : Anv.Interface {
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, conf.anv))) : Anv.Interface;
    };
   
    public func pwr(conf : Config) : Pwr.Interface {
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, conf.pwr))) : Pwr.Interface;
    };

    public func history(conf : Config) : History.Interface {
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, conf.history))) : History.Interface;
    };

    public func nft(conf : Config, slot : CanisterSlot) : Nft.Interface {
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, slot))) : Nft.Interface;
    };

    public func account(conf : Config, slot : CanisterSlot) : Account.Interface {
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, slot))) : Account.Interface;
    };

    public func accountFromAid(conf : Config, aid : Nft.AccountIdentifier) : Account.Interface {
        let (start, end) = conf.account;
        let max = end - start;
        actor(Principal.toText(Nft.APrincipal.fromSlot(conf.space, start + Nft.AccountIdentifier.slot(aid, max)))) : Account.Interface;
    };

    public func ledger(conf: Config): Ledger.Interface {
        actor("ryjl3-tyaaa-aaaaa-aaaba-cai") : Ledger.Interface;
    };

    public type LogEvent = {
        time : Nat32;
        msg : Text;
    };

    public type StatsResponse = {
        cycles: Nat;
        cycles_recieved: Nat;
        rts_version:Text;
        rts_memory_size:Nat;
        rts_heap_size:Nat;
        rts_total_allocation:Nat;
        rts_reclaimed:Nat;
        rts_max_live_size:Nat;
    };

    public module Slots = {
        public func installed_nft<T>(conf: Config, fn : (CanisterSlot) -> T) : [T] {
            let nft_start = conf.nft.0;
            let nft_end = conf.nft_avail[ Array_.size(conf.nft_avail) - 1 ];

            return Array_.amap<T>(Nat64.toNat(nft_end - nft_start) + 1, func (index: Nat) : T {
                let slot: CanisterSlot = nft_start + Nat64.fromNat(index);
                return fn(slot);
            });
        };

        public func installed_history<T>(conf: Config, fn : (CanisterSlot) -> T) : [T] {
            let history_start = conf.history_range.0;
            let history_end = conf.history;

            return Array_.amap<T>(Nat64.toNat(history_end - history_start) + 1, func (index: Nat) : T {
                let slot: CanisterSlot = history_start + Nat64.fromNat(index);
                return fn(slot);
            });
        };

        public func installed_account<T>(conf: Config, fn : (CanisterSlot) -> T) : [T] {
            return Array_.amap<T>(Nat64.toNat(conf.account.1 - conf.account.0) + 1, func (index: Nat) : T {
                let slot: CanisterSlot = conf.account.0 + Nat64.fromNat(index);
                return fn(slot);
            });
        };

        public func installed_all(conf: Config, fn : (CanisterSlot) -> ()) : () {

            ignore installed_nft<()>(conf, func (slot: CanisterSlot) {
                fn(slot);
            });

            ignore installed_account<()>(conf, func (slot: CanisterSlot) {
                 fn(slot);
            });

            // all history
            ignore installed_history<()>(conf, func (slot: CanisterSlot) {
                fn(slot);
            });


            // single cans
            fn(conf.pwr);
            fn(conf.anv);
            fn(conf.treasury);

        };

    }

}
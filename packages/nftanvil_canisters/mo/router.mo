import Debug "mo:base/Debug";

import Array  "mo:base/Array";
import Array_ "./lib/Array";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Error "mo:base/Error";

import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim"; 
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Time "mo:base/Time";
import Int "mo:base/Int";

import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";

import HashMap "mo:base/HashMap";
import Cluster  "./type/Cluster";
import Nft "./type/nft_interface";

import AAA "./type/aaa_interface";

shared({caller = _installer}) actor class Router() = this {

    let IC = actor "aaaaa-aa" : AAA.Interface;
    private stable var _conf : Cluster.Config = Cluster.Config.default();
    private stable var _oracle : Cluster.Oracle = Cluster.Oracle.default();

    public type CanisterSlot = Nft.CanisterSlot;

    private var _wasm_nft : [Nat8] = [];
    private var _wasm_account : [Nat8] = [];
    private var _wasm_pwr : [Nat8] = [];
    private var _wasm_history : [Nat8] = [];
    private var _wasm_anv : [Nat8] = [];
    private var _wasm_treasury : [Nat8] = [];

    private var _job_processing : Bool = false;
 
    private var _jobs : List.List<Job> = List.nil<Job>();
    
    private var _stats_refuel : Nat = 0;
    private var _stats_jobs_success : Nat = 0;
    private var _stats_jobs_fail : Nat = 0;

    private var _log : List.List<Cluster.LogEvent> = List.nil<Cluster.LogEvent>(); 
    private var _log_size : Nat = 0;

    public type Job = {
            #install_code : Job_Install_Code;
            #oracle_set : Job_Oracle_Set;
            #config_set : Job_Config_Set;
            #refuel : Job_Refuel;
            #callback : Job_Callback;
    };

    public type Job_Install_Code = {
        slot : CanisterSlot;
        wasm : {#nft; #account; #pwr; #history; #anv; #treasury};
        mode : {#reinstall; #upgrade; #install};
    };

    public type Job_Oracle_Set = {
        slot : CanisterSlot;
        oracle : Cluster.Oracle;
    };

    public type Job_Config_Set = {
        slot : CanisterSlot;
        config : Cluster.Config;
    };

  
    public type Job_Refuel = {
        slot : CanisterSlot;
    };

    public type Job_Callback =  () -> async ();


    system func heartbeat() : async () {
       
        if (_job_processing) return ();

        if (List.size(_jobs) > 0) {

            let (jobMaybe, newList) = List.pop(_jobs);
            switch(jobMaybe) {
                case (?job) {
                    _jobs := newList;
                    _job_processing := true;

                    try {
                        await job_run(job);
                        _stats_jobs_success += 1;
                    } catch (e) { 
                        log("job error " #debug_show(Error.message(e)));
                        _stats_jobs_fail += 1;
                    };
                    
                    _job_processing := false;
                };
                case (null) {
                    ()
                }
            }
           
        };

    };

    public shared({caller}) func refuel_unoptimised() : async () {
        assert(caller == _installer);

        ignore Array_.amap<()>(Nat64.toNat(_conf.space[0][1] - _conf.space[0][0]), func (index: Nat) : () {
                let slot = Nat64.fromNat(index);
                job_add(#refuel({slot;}));
        })
    };

    public shared({caller}) func refuel() : async () {
        assert(caller == _installer);

       
        ignore Cluster.Slots.installed_all(_conf, func (slot: CanisterSlot) {
            job_add(#refuel({slot}));   
        });


    };

    public shared({caller}) func reinstall() : async () {
        assert(caller == _installer);

        ignore Cluster.Slots.installed_nft<()>(_conf, func (slot: CanisterSlot) {
            job_add(#install_code({
                slot;
                wasm = #nft;
                mode = #reinstall;
                }));
            
            job_add(#oracle_set({slot; oracle = _oracle}));
            job_add(#config_set({slot; config = _conf}));
        });

        

        // create pwr canister
        job_add(#install_code({
            slot = _conf.pwr;
            wasm = #pwr;
            mode = #reinstall;
        }));


        job_add(#oracle_set({slot = _conf.pwr; oracle = _oracle}));
        job_add(#config_set({slot = _conf.pwr; config = _conf}));



        // create anv canister
        job_add(#install_code({
            slot = _conf.anv;
            wasm = #anv;
            mode = #reinstall;
        }));

        job_add(#oracle_set({slot = _conf.anv; oracle = _oracle}));
        job_add(#config_set({slot = _conf.anv; config = _conf}));


        ignore Cluster.Slots.installed_history<()>(_conf, func (slot: CanisterSlot) {
             job_add(#install_code({
                slot;
                wasm = #history;
                mode = #reinstall;
            }));

            job_add(#oracle_set({slot; oracle = _oracle}));
            job_add(#config_set({slot; config = _conf}));
        });
  


        // create treasury canister
        job_add(#install_code({
            slot = _conf.treasury;
            wasm = #treasury;
            mode = #reinstall;
        }));

        job_add(#oracle_set({slot = _conf.treasury; oracle = _oracle}));
        job_add(#config_set({slot = _conf.treasury; config = _conf}));


        // create all account canisters
        ignore Cluster.Slots.installed_account<()>(_conf, func (slot: CanisterSlot) {

            job_add(#install_code({
                slot;
                wasm = #account;
                mode = #reinstall;
                }));

            job_add(#oracle_set({slot; oracle = _oracle}));
            job_add(#config_set({slot; config = _conf}));
        });

    };



    public shared({caller}) func upgrade() : async () {
        assert(caller == _installer);

        // all nft canisters with installed code. There are a lot which don't have installed code and their cycles should stay 100_000_000_000
        ignore Cluster.Slots.installed_nft<()>(_conf, func (slot: CanisterSlot) {

            job_add(#install_code({
                slot;
                wasm = #nft;
                mode = #upgrade;
                }));

        });

     
        // create pwr canister
        job_add(#install_code({
            slot = _conf.pwr;
            wasm = #pwr;
            mode = #upgrade;
        }));


        job_add(#oracle_set({slot = _conf.pwr; oracle = _oracle}));
        job_add(#config_set({slot = _conf.pwr; config = _conf}));


        // create anv canister
        job_add(#install_code({
            slot = _conf.anv;
            wasm = #anv;
            mode = #upgrade;
        }));

        job_add(#oracle_set({slot = _conf.anv; oracle = _oracle}));
        job_add(#config_set({slot = _conf.anv; config = _conf}));


        ignore Cluster.Slots.installed_history<()>(_conf, func (slot: CanisterSlot) {
            job_add(#install_code({
                slot;
                wasm = #history;
                mode = #upgrade;
            }));

            job_add(#oracle_set({slot; oracle = _oracle}));
            job_add(#config_set({slot; config = _conf}));

        });
        


       // create treasury canister
        job_add(#install_code({
            slot = _conf.treasury;
            wasm = #treasury;
            mode = #upgrade;
        }));

        job_add(#oracle_set({slot = _conf.treasury; oracle = _oracle}));
        job_add(#config_set({slot = _conf.treasury; config = _conf}));


        // upgrade all account canisters
        ignore Cluster.Slots.installed_account<()>(_conf, func (slot: CanisterSlot) {
            job_add(#install_code({
                slot;
                wasm = #account;
                mode = #upgrade;
                }));

            job_add(#oracle_set({slot; oracle = _oracle}));
            job_add(#config_set({slot; config = _conf}));
        });

    };

    private func job_add(j: Job) : () {
        _jobs := List.append(_jobs, List.fromArray<Job>([j]));
    };
 
    private func job_run(j: Job) : async () {
        switch(j) {
            case (#install_code(x)) await job_install_code(x);
            case (#oracle_set(x)) await job_oracle_set(x);
            case (#config_set(x)) await job_conf_set(x);
            case (#refuel(x)) await job_refuel(x);
            case (#callback(x)) await job_callback(x);


        };
    };



    private func job_oracle_set({slot; oracle}: Job_Oracle_Set) : async () {
        log("oracle_set " # debug_show({slot; oracle}));

        let canister_id = Nft.APrincipal.fromSlot(_conf.space, slot);

        let can = actor(Principal.toText(canister_id)) : Cluster.CommonActor;

        let re = await can.oracle_set(oracle);

        // log("job_oracle_set result" #debug_show(re));

    };    


    private func job_callback(callback: Job_Callback) : async () {
        log("callback");
        await callback();
    };
    
    private func job_refuel({slot}: Job_Refuel) : async () {

        let canister_id = Nft.APrincipal.fromSlot(_conf.space, slot);

        let stats = await IC.canister_status({canister_id});
        
        //log("job_refuel can status " #debug_show(stats));

        //let can = actor(Principal.toText(canister_id)) : Cluster.CommonActor;
        switch(stats.module_hash) {
            case (?installed) {
                 if (stats.cycles < (Cluster.MGR_MIN_ACTIVE_CAN_CYCLES - Cluster.MGR_IGNORE_CYCLES)) {
                      let amount = Cluster.MGR_MIN_ACTIVE_CAN_CYCLES - stats.cycles;
                      Cycles.add( amount );
                      await IC.deposit_cycles({canister_id});
                      _stats_refuel += amount;
                      log("refuel " # debug_show({slot}) # " added " #debug_show(amount));
                };
            };
            case (null) {
                if (stats.cycles < (Cluster.MGR_MIN_INACTIVE_CAN_CYCLES - Cluster.MGR_IGNORE_CYCLES)) {
                      let amount = Cluster.MGR_MIN_INACTIVE_CAN_CYCLES - stats.cycles;
                      Cycles.add( amount );
                      await IC.deposit_cycles({canister_id});
                      _stats_refuel += amount;
                      log("refuel " # debug_show({slot}) # "added  " #debug_show(amount));
                };
            };
        };

    };    




    private func job_conf_set({slot; config}: Job_Config_Set) : async () {
        log("conf_set " # debug_show({slot; config}));

        let canister_id = Nft.APrincipal.fromSlot(_conf.space, slot);

        let can = actor(Principal.toText(canister_id)) : Cluster.CommonActor;

        let re = await can.config_set(config);

        //log("job_conf_set result" #debug_show(re));

    };    

    private func job_install_code({slot; wasm; mode}: Job_Install_Code) : async () {
        log("install_code " # debug_show({slot; wasm; mode}));

        let canister_id = Nft.APrincipal.fromSlot(_conf.space, slot);

        let re = await IC.install_code({
              arg = [];
              wasm_module = switch(wasm) {
                  case (#nft) _wasm_nft;
                  case (#account) _wasm_account;
                  case (#pwr) _wasm_pwr;
                  case (#history) _wasm_history;
                  case (#anv) _wasm_anv;
                  case (#treasury) _wasm_treasury;

              };
              mode;
              canister_id = canister_id;
            });

        //log("job_install_code result" #debug_show(re));
    };

    private func log(msg: Text) : () {
        let p: Cluster.LogEvent = {
            time = Nat32.fromIntWrap(Int.div(Time.now(), 1000000000));
            msg
        };

        Debug.print(msg);

        _log := List.append(_log, List.fromArray<Cluster.LogEvent>([p]));
        _log_size += 1;

        if (_log_size > 500) {
            _log := List.drop(_log, 10);
            _log_size -= 10;
            };
        
    };
    
    public query func log_get() : async [Cluster.LogEvent] {
        let re = List.toArray(_log);
        return re;
    };


    // This func is only for local development
    public shared ({caller}) func create_local_canisters() : async () {
            assert(caller == _installer);
            Cycles.add(200_000_000_000);

            var cnt = 0;
            let max = 20;
            var start : ?Nat64 = null;
            var end : ?Nat64 = null;

            while (cnt < max) {
                let {canister_id} = await IC.create_canister({settings = ?{
                    controllers = ?[_installer, Principal.fromActor(this)];
                    compute_allocation = null;
                    memory_allocation = null; 
                    freezing_threshold = ?31_540_000
                }});
                if (cnt == 0) start := Nft.APrincipal.toIdx(canister_id);
                if (cnt == max - 1) end := Nft.APrincipal.toIdx(canister_id);
                cnt += 1;
            };

            switch(start) {
                case (?range_start) {


                    switch(end) {
                        case (?range_end) {

                            _conf := {
                                    router = Principal.fromActor(this);

                                    nft = (0,5);
                                    nft_avail = [0,1,2];
                                    account = (11,12);
                                    pwr = 15;
                                    anv = 16;
                                    treasury = 17;
                                    history = 6;
                                    history_range = (6,10);
                                    space = [[range_start, range_end]]
                                };

                            };
                            case (null) {
                                assert(false);
                            };
                        };
                

                };
                case (null) {
                    assert(false);
                };
            };


            ();

    };

    public shared({caller}) func event_history_full() : async () {
        switch(Nft.APrincipal.toSlot(_conf.space, caller)) {
            case (?slot) {
                assert(slot == _conf.history);
                log("event_history_full " # debug_show({slot}) );
    
                job_add(#callback( func () : async () {
                    

                    let new_history_slot = _conf.history + 1;

                    await job_install_code({slot = new_history_slot; wasm = #history; mode= #install});
                    //await job_oracle_set({slot = new_history_slot; oracle = _oracle});
                    await job_conf_set({slot = new_history_slot; config = _conf});

                    let {nft; nft_avail; account; router; pwr; anv; treasury; history; history_range; space} = _conf;
                    _conf := {nft; nft_avail; account; router; pwr; anv; treasury; history=new_history_slot; history_range; space};
                    
                    job_add(#callback( func () : async () {
                        ignore Cluster.Slots.installed_all(_conf, func (slot: CanisterSlot) {
                            job_add(#config_set({slot; config=_conf}));   
                        });
                    }));
                    
                 }));

               
            };
            case (null) {
                ();
            }
        }
    };

    public shared({caller}) func event_nft_full() : async () {
        switch(Nft.APrincipal.toSlot(_conf.space, caller)) {
            case (?slot) {
                log("event_nft_full " # debug_show({slot}) );
    
                job_add(#callback( func () : async () {
                    

                    let nft_end = _conf.nft_avail[ Array_.size(_conf.nft_avail) - 1 ];
                    let new_nft = nft_end + 1;
                    let new_nft_avail =  Array.append(Array.filter(_conf.nft_avail, func (x: CanisterSlot) : Bool {
                            x != slot
                        }),[new_nft]);

                    
                    await job_install_code({slot = new_nft; wasm = #nft; mode= #install});
                    await job_oracle_set({slot = new_nft; oracle = _oracle});
                    await job_conf_set({slot = new_nft; config = _conf});
                    
                    let {nft; nft_avail; account; router; pwr; anv; treasury; history; history_range; space} = _conf;
                    _conf := {nft; nft_avail = new_nft_avail; account; router; pwr; anv; treasury; history; history_range; space};
                 }));

               
               
            };
            case (null) {
                ();
            }
        }
    };

    public shared({caller}) func wasm_set({name: Text; wasm:[Nat8]}) : async () {
        assert(caller == _installer);
        switch(name) {
            case ("nft") _wasm_nft := wasm;
            case ("account") _wasm_account := wasm;
            case ("pwr") _wasm_pwr := wasm;
            case ("history") _wasm_history := wasm;
            case ("anv") _wasm_anv := wasm;
            case ("treasury") _wasm_treasury := wasm;

            case (_) { assert(false); (); }
        }
    };

    public shared({caller}) func config_set(conf : Cluster.Config) : async () {
        assert(caller == _installer);
        _conf := conf
    };

    public query func config_get() : async Cluster.Config {
        return _conf;
    };

    public type StatsResponse = {
        cycles: Nat;
        rts_version:Text;
        rts_memory_size:Nat;
        rts_heap_size:Nat;
        rts_total_allocation:Nat;
        rts_reclaimed:Nat;
        rts_max_live_size:Nat;
    };


    public query func stats() : async StatsResponse {
        {
            cycles = Cycles.balance();
            rts_version = Prim.rts_version();
            rts_memory_size = Prim.rts_memory_size();
            rts_heap_size = Prim.rts_heap_size();
            rts_total_allocation = Prim.rts_total_allocation();
            rts_reclaimed = Prim.rts_reclaimed();
            rts_max_live_size = Prim.rts_max_live_size();
        }
    };


}
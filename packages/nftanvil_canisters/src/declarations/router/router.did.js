export const idlFactory = ({ IDL }) => {
  const CanisterSlot__1 = IDL.Nat64;
  const CanisterSlot = IDL.Nat64;
  const CanisterRange = IDL.Tuple(CanisterSlot, CanisterSlot);
  const Config = IDL.Record({
    'anv' : CanisterSlot__1,
    'nft' : CanisterRange,
    'pwr' : CanisterSlot__1,
    'history' : CanisterSlot__1,
    'nft_avail' : IDL.Vec(CanisterSlot__1),
    'space' : IDL.Vec(IDL.Vec(IDL.Nat64)),
    'account' : CanisterRange,
    'router' : CanisterSlot__1,
    'treasury' : CanisterSlot__1,
  });
  const StatsResponse = IDL.Record({
    'rts_max_live_size' : IDL.Nat,
    'cycles' : IDL.Nat,
    'rts_memory_size' : IDL.Nat,
    'rts_total_allocation' : IDL.Nat,
    'rts_heap_size' : IDL.Nat,
    'rts_reclaimed' : IDL.Nat,
    'rts_version' : IDL.Text,
  });
  const Router = IDL.Service({
    'config_get' : IDL.Func([], [Config], ['query']),
    'config_set' : IDL.Func([Config], [], []),
    'create_local_canisters' : IDL.Func([], [], []),
    'reinstall' : IDL.Func([], [], []),
    'reportOutOfMemory' : IDL.Func([], [], []),
    'stats' : IDL.Func([], [StatsResponse], ['query']),
    'wasm_set' : IDL.Func(
        [IDL.Record({ 'name' : IDL.Text, 'wasm' : IDL.Vec(IDL.Nat8) })],
        [],
        [],
      ),
  });
  return Router;
};
export const init = ({ IDL }) => { return []; };

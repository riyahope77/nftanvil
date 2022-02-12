export const idlFactory = ({ IDL }) => {
  const AccountIdentifier = IDL.Vec(IDL.Nat8);
  const TokenIndex = IDL.Nat16;
  const TransactionId = IDL.Vec(IDL.Nat8);
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
    'history_range' : CanisterRange,
    'router' : IDL.Principal,
    'treasury' : CanisterSlot__1,
  });
  const TokenIdentifier__1 = IDL.Nat64;
  const TokenIdentifier = IDL.Nat64;
  const AddressInfo = IDL.Record({
    'background' : TokenIdentifier,
    'name' : IDL.Text,
    'avatar' : TokenIdentifier,
  });
  const AccountMeta = IDL.Record({
    'info' : IDL.Opt(AddressInfo),
    'transactions' : IDL.Vec(TransactionId),
  });
  const StatsResponse = IDL.Record({
    'cycles_recieved' : IDL.Nat,
    'rts_max_live_size' : IDL.Nat,
    'cycles' : IDL.Nat,
    'rts_memory_size' : IDL.Nat,
    'rts_total_allocation' : IDL.Nat,
    'rts_heap_size' : IDL.Nat,
    'rts_reclaimed' : IDL.Nat,
    'rts_version' : IDL.Text,
  });
  const Class = IDL.Service({
    'add' : IDL.Func([AccountIdentifier, TokenIndex], [], []),
    'add_transaction' : IDL.Func([AccountIdentifier, TransactionId], [], []),
    'config_set' : IDL.Func([Config], [], []),
    'list' : IDL.Func(
        [AccountIdentifier, IDL.Nat],
        [IDL.Vec(TokenIdentifier__1)],
        ['query'],
      ),
    'meta' : IDL.Func([AccountIdentifier], [IDL.Opt(AccountMeta)], ['query']),
    'rem' : IDL.Func([AccountIdentifier, TokenIndex], [], []),
    'stats' : IDL.Func([], [StatsResponse], ['query']),
    'wallet_receive' : IDL.Func([], [], []),
  });
  return Class;
};
export const init = ({ IDL }) => { return []; };

import type { Principal } from '@dfinity/principal';
export type AccountIdentifier = string;
export interface ApproveRequest {
  'token' : TokenIdentifier,
  'subaccount' : [] | [SubAccount],
  'allowance' : Balance,
  'spender' : Principal,
}
export type ApproveResponse = { 'ok' : null } |
  {
    'err' : { 'InsufficientBalance' : null } |
      { 'InvalidToken' : TokenIdentifier } |
      { 'Unauthorized' : AccountIdentifier } |
      { 'Other' : string }
  };
export type Balance = bigint;
export interface BalanceRequest { 'token' : TokenIdentifier, 'user' : User }
export type BalanceResponse = { 'ok' : Balance } |
  { 'err' : CommonError };
export type BearerResponse = { 'ok' : AccountIdentifier } |
  { 'err' : CommonError };
export interface BurnRequest {
  'token' : TokenIdentifier,
  'notify' : boolean,
  'memo' : Memo,
  'user' : User,
  'subaccount' : [] | [SubAccount],
  'amount' : Balance,
}
export type BurnResponse = { 'ok' : Balance } |
  {
    'err' : { 'CannotNotify' : AccountIdentifier } |
      { 'InsufficientBalance' : null } |
      { 'InvalidToken' : TokenIdentifier } |
      { 'Rejected' : null } |
      { 'Unauthorized' : AccountIdentifier } |
      { 'Other' : string }
  };
export type CommonError = { 'InvalidToken' : TokenIdentifier } |
  { 'Other' : string };
export type Extension = string;
export type ItemClassId = bigint;
export type Media = { 'img' : URL } |
  { 'video' : URL };
export type Memo = Array<number>;
export interface Metadata {
  'media' : [] | [Media],
  'thumb' : [] | [URL],
  'created' : number,
  'cooldownUntil' : [] | [number],
  'boundUntil' : [] | [number],
  'classId' : ItemClassId,
  'entropy' : Array<number>,
}
export type MetadataResponse = { 'ok' : Metadata__1 } |
  { 'err' : CommonError };
export interface Metadata__1 {
  'media' : [] | [Media],
  'thumb' : [] | [URL],
  'created' : number,
  'cooldownUntil' : [] | [number],
  'boundUntil' : [] | [number],
  'classId' : ItemClassId,
  'entropy' : Array<number>,
}
export interface MintRequest {
  'to' : User,
  'media' : [] | [Media],
  'thumb' : [] | [URL],
  'classId' : ItemClassId,
}
export type MintResponse = { 'ok' : TokenIndex__1 } |
  { 'err' : { 'Rejected' : null } | { 'OutOfMemory' : null } };
export interface NFT {
  'allowance' : (arg_0: Request) => Promise<Response>,
  'approve' : (arg_0: ApproveRequest) => Promise<ApproveResponse>,
  'balance' : (arg_0: BalanceRequest) => Promise<BalanceResponse>,
  'bearer' : (arg_0: TokenIdentifier) => Promise<BearerResponse>,
  'burn' : (arg_0: BurnRequest) => Promise<BurnResponse>,
  'cyclesAccept' : () => Promise<undefined>,
  'cyclesBalance' : () => Promise<bigint>,
  'debugMode' : (arg_0: [] | [string]) => Promise<undefined>,
  'extensions' : () => Promise<Array<Extension>>,
  'metadata' : (arg_0: TokenIdentifier) => Promise<MetadataResponse>,
  'mintNFT' : (arg_0: MintRequest) => Promise<MintResponse>,
  'owned' : (arg_0: User__1) => Promise<Array<OwnedResponse>>,
  'stats' : () => Promise<StatsResponse>,
  'supply' : (arg_0: TokenIdentifier) => Promise<SupplyResponse>,
  'transfer' : (arg_0: TransferRequest) => Promise<TransferResponse>,
}
export interface OwnedResponse {
  'idx' : TokenIndex,
  'metadata' : [] | [Metadata],
}
export interface Request {
  'token' : TokenIdentifier,
  'owner' : User,
  'spender' : Principal,
}
export type Response = { 'ok' : Balance } |
  { 'err' : CommonError };
export interface StatsResponse {
  'rts_max_live_size' : bigint,
  'transfers' : number,
  'minted' : number,
  'cycles' : bigint,
  'rts_memory_size' : bigint,
  'rts_total_allocation' : bigint,
  'accounts' : number,
  'burned' : number,
  'rts_heap_size' : bigint,
  'rts_reclaimed' : bigint,
  'rts_version' : string,
}
export type SubAccount = Array<number>;
export type SupplyResponse = { 'ok' : Balance } |
  { 'err' : CommonError };
export type TokenIdentifier = string;
export type TokenIndex = number;
export type TokenIndex__1 = number;
export interface TransferRequest {
  'to' : User,
  'token' : TokenIdentifier,
  'notify' : boolean,
  'from' : User,
  'memo' : Memo,
  'subaccount' : [] | [SubAccount],
  'amount' : Balance,
}
export type TransferResponse = { 'ok' : Balance } |
  {
    'err' : { 'CannotNotify' : AccountIdentifier } |
      { 'InsufficientBalance' : null } |
      { 'InvalidToken' : TokenIdentifier } |
      { 'Rejected' : null } |
      { 'Unauthorized' : AccountIdentifier } |
      { 'Other' : string }
  };
export type URL = string;
export type User = { 'principal' : Principal } |
  { 'address' : AccountIdentifier };
export type User__1 = { 'principal' : Principal } |
  { 'address' : AccountIdentifier };
export interface _SERVICE extends NFT {}

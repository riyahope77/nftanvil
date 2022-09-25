//@name=pwr
import Array "mo:base/Array";
import Array_ "mo:array/Array";
import Base32 "mo:encoding/Base32";
import Binary "mo:encoding/Binary";
import Blob "mo:base/Blob";
import Char "mo:base/Char";
import CRC32 "mo:hash/CRC32";
import Hash "mo:base/Hash";
import Hex "mo:encoding/Hex";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Principal "mo:principal/Principal";
import RawAccountId "mo:principal/AccountIdentifier";
import Text "mo:base/Text";
import Nft "./nft_interface";
import Ledger "./ledger_interface";
import Treasury "./treasury_interface";

module {

    //(0🔶 Interface
    public type Interface = actor {
        balance              : query BalanceRequest         -> async BalanceResponse;
        exists               : query (aid: Nft.AccountIdentifier) -> async Bool;
        pwr_transfer         : shared TransferRequest       -> async TransferResponse;
        balanceAddExternal   : shared (FTokenId, AccountIdentifier, Balance) -> async ();
        balanceAddExternalProtected   : shared (FTokenId, AccountIdentifier, Balance, Bool) -> async Result.Result<(), Text>;

        // only for icp
        pwr_withdraw         : shared WithdrawRequest       -> async WithdrawResponse;
        pwr_purchase_intent  : shared PurchaseIntentRequest -> async PurchaseIntentResponse;
        pwr_purchase_claim   : shared PurchaseClaimRequest  -> async PurchaseClaimResponse;
        nft_mint             : shared (slot: Nft.CanisterSlot, request: Nft.MintRequest) -> async Nft.MintResponse;
        ft_mint              : shared ({id: Nft.FTokenId; aid: AccountIdentifier; amount : Balance}) -> async ();
    };


    public let TOKEN_ICP : FTokenId = 1;
    public let TOKEN_ANV : FTokenId = 2;

    public type BalanceRequest = {
        user: Nft.User;
    };

    public type BalanceResponse = {
        ft : AccountRecordSerialized;
        // pwr : Balance;
        // anv : Balance;
        oracle : Nft.Oracle;
    };

    public type PurchaseIntentRequest = {
        user : User;
        subaccount: ?SubAccount;
    };

    public type PurchaseIntentResponse = Result.Result<
        AccountIdentifier,
        Text
    >;

    public type PurchaseClaimRequest = {
        user : User;
        subaccount : ?SubAccount;
    };

    public type PurchaseClaimResponse = Result.Result<
        {transactionId: Blob}, {
            #PaymentTooSmall; // if it's smaller than Ledger ICP transfer fee we can't move it to main account and use that value at all
            #Ledger: Ledger.TransferError
        }
    >;

    public type Currency = {#anv; #pwr};

    public type TransferRequest = {
        token      : FTokenId;
        from       : User;
        to         : User;
        amount     : Balance;
        memo       : Memo;
        subaccount : ?SubAccount;
    };


    public type TransferResponse = Result.Result<{transactionId: Blob}, Nft.TransferResponseError>;

    public type WithdrawRequest = Treasury.WithdrawRequest;
    public type WithdrawResponse = Treasury.WithdrawResponse;

    public type AccountIdentifier = Nft.AccountIdentifier;
    public type Balance = Nft.Balance;
    public type User = Nft.User;
    public type SubAccount = Nft.SubAccount;
    public type Memo = Nft.Memo;
    //)


    public type FTokenId = Nat64;
   

    public type AccountRecord = [var (FTokenId,Balance)];
    // {
    //     var pwr : Nat64;
    //     var anv : Nat64;
    //     };

    public type AccountRecordSerialized = [(FTokenId,Balance)];
    // {
    //     pwr : Nat64;
    //     anv : Nat64;
    // };

    // public type AccountResult = AccountRecordSerialized;
    // {
    //     pwr : Nat64;
    //     anv : Nat64;
    // };

    public func AccountRecordFindToken(x: AccountRecord, search: FTokenId) : ?Nat {
        var found : ?Nat = null;
        label se for (idx in x.keys()) {
            if (x[idx].0 == search) {
                found := ?idx;
                break se;
            };
        };
        found;
        // {
        //     pwr = x.pwr;
        //     anv = x.anv;
        // }
    };

    public func AccountRecordSerialize(x: AccountRecord) : AccountRecordSerialized {
        Array.freeze(x);
        
        // {
        //     pwr = x.pwr;
        //     anv = x.anv;
        // }
    };

    public func AccountRecordUnserialize(x: AccountRecordSerialized) : AccountRecord {
        Array.thaw(x);
        // {
        //     var pwr = x.pwr;
        //     var anv = x.anv;
        // }
    };

    public func AccountRecordBlank() : AccountRecord {
        [var]
        // {
        //     var pwr = 0;
        //     var anv = 0;
        // }
    };
    

}   
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Nat32 "mo:base/Nat32";
import Hash "mo:base/Hash";
import Buffer "mo:base/Buffer";
import Array_ "./Array";


module {

    public class Inventory(
        initial : [Nat32]
    )
    {

        var b : Buffer.Buffer<Nat32> = Array_.bufferFromArray(initial);

        public func serialize() : [Nat32] {
          b.toArray()
        };

        public func indexOf(v: Nat32) : ?Nat {
            let it = b.vals();
            var idx:Nat = 0;
            for (x in it) {
                if (Nat32.equal(x,v)) return ?idx;
                idx += 1;
            };
            return null;
        };

        public func add(v :Nat32) : () {
            switch(indexOf(v)) {
                case (?idx) {
                    ()
                };
                case (_) {
                    switch(indexOf(0)) {
                        case (?emptyIdx) {
                            b.put(emptyIdx,v)
                        };
                        case (null) {
                            b.add(v)
                        }
                    }
                }
            }
        };

        public func rem(v: Nat32) : () {
            switch(indexOf(v)) {
                case (?idx) {
                    b.put(idx, 0);
                };
                case (_) {
                    ()
                }
            }
        };

        public func list() : Iter.Iter<Nat32> {
            Iter.filter(b.vals(), func (v: Nat32) : Bool { v != 0 });
        };

    }

}
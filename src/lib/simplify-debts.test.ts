import { describe, expect, it } from "vitest";
import { simplifyDebts, subtractPendingTransfers } from "@/lib/simplify-debts";

function net(userId: string, amount: number) {
  return { userId, net: amount };
}

function pay(fromUserId: string, toUserId: string, amount: number) {
  return { fromUserId, toUserId, amount };
}

describe("simplifyDebts", () => {
  it("returns no transfers when everyone is already settled", () => {
    expect(
      simplifyDebts([net("a", 0), net("b", 0), net("c", 0)]),
    ).toEqual([]);
  });

  it("returns no transfers for an empty household", () => {
    expect(simplifyDebts([])).toEqual([]);
  });

  it("settles one debtor against many creditors", () => {
    expect(
      simplifyDebts([net("a", -100), net("b", 40), net("c", 60)]),
    ).toEqual([pay("a", "c", 60), pay("a", "b", 40)]);
  });

  it("settles many debtors against one creditor", () => {
    expect(
      simplifyDebts([net("a", -40), net("b", -60), net("c", 100)]),
    ).toEqual([pay("b", "c", 60), pay("a", "c", 40)]);
  });

  it("breaks ties with a stable userId order", () => {
    expect(
      simplifyDebts([
        net("a", -50),
        net("b", -50),
        net("c", 50),
        net("d", 50),
      ]),
    ).toEqual([pay("a", "c", 50), pay("b", "d", 50)]);
  });

  it("handles uneven split leftovers in cents", () => {
    expect(
      simplifyDebts([net("a", 10.01), net("b", 20.02), net("c", -30.03)]),
    ).toEqual([pay("c", "b", 20.02), pay("c", "a", 10.01)]);
  });

  it("minimizes transfers for five or more members", () => {
    expect(
      simplifyDebts([
        net("a", 30),
        net("b", 20),
        net("c", -10),
        net("d", -25),
        net("e", -15),
      ]),
    ).toEqual([
      pay("d", "a", 25),
      pay("e", "b", 15),
      pay("c", "a", 5),
      pay("c", "b", 5),
    ]);
  });

  it("does not mutate the input balances", () => {
    const balances = [net("a", -12.5), net("b", 12.5)];
    const snapshot = structuredClone(balances);
    simplifyDebts(balances);
    expect(balances).toEqual(snapshot);
  });
});

describe("subtractPendingTransfers", () => {
  it("hides a suggested transfer that is already marked paid", () => {
    expect(
      subtractPendingTransfers(
        [pay("a", "b", 40)],
        [pay("a", "b", 40)],
      ),
    ).toEqual([]);
  });

  it("reduces a suggestion by a partial pending payment", () => {
    expect(
      subtractPendingTransfers(
        [pay("a", "b", 40)],
        [pay("a", "b", 15)],
      ),
    ).toEqual([pay("a", "b", 25)]);
  });
});

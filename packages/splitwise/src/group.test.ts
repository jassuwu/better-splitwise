import { describe, it, expect } from "vitest";
import { toCreateGroupParams } from "./group";

describe("toCreateGroupParams", () => {
  it("emits name, type, and existing members by user_id", () => {
    const p = toCreateGroupParams({ name: "Goa", group_type: "trip", members: [{ user_id: 11 }, { user_id: 22 }] });
    expect(p.name).toBe("Goa");
    expect(p.group_type).toBe("trip");
    expect(p["users__0__user_id"]).toBe(11);
    expect(p["users__1__user_id"]).toBe(22);
  });

  it("emits invites by first_name + email (no user_id)", () => {
    const p = toCreateGroupParams({ name: "Flat", members: [{ email: "a@b.com", first_name: "Ada" }] });
    expect(p["users__0__email"]).toBe("a@b.com");
    expect(p["users__0__first_name"]).toBe("Ada");
    expect(p["users__0__user_id"]).toBeUndefined();
  });

  it("includes simplify_by_default only when set", () => {
    expect(toCreateGroupParams({ name: "x" }).simplify_by_default).toBeUndefined();
    expect(toCreateGroupParams({ name: "x", simplify_by_default: true }).simplify_by_default).toBe(true);
  });
});

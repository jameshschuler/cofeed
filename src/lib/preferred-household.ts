export type MembershipForPreference = {
  householdId: string;
  role: "owner" | "caregiver" | "viewer";
  isDefault: boolean;
  createdAt: Date;
};

// The household a user should fall back to when they have no preferred one:
// the household they own, otherwise the one they joined first.
export function pickPreferredHousehold(memberships: MembershipForPreference[]) {
  const current = memberships.find((membership) => membership.isDefault);
  if (current) {
    return current.householdId;
  }
  const [first] = [...memberships].sort((left, right) => {
    const ownerOrder = Number(right.role === "owner") - Number(left.role === "owner");
    return ownerOrder || left.createdAt.getTime() - right.createdAt.getTime();
  });
  return first?.householdId ?? null;
}

// The baby profile shown on the Account page: the baby in the household the user owns
// (which they can always edit), otherwise the preferred household's baby.
export function pickBabyProfileBabyId(
  households: Array<{ member_role: string; baby_id: string | null }>,
  preferredBabyId: string | null,
) {
  const owned = households.find(
    (household) => household.member_role === "owner" && household.baby_id,
  );
  return owned?.baby_id ?? preferredBabyId;
}

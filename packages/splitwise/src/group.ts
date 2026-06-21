import type { CreateGroupInput, CreateGroupParams } from "./types";

/**
 * Flatten a {@link CreateGroupInput} into Splitwise's create_group wire body.
 * Existing members go in as `users__i__user_id`; invites as
 * `users__i__first_name`/`last_name`/`email` (Splitwise emails them an invite).
 * Mirrors the by-shares flattening in {@link toCreateExpenseParams}.
 */
export function toCreateGroupParams(input: CreateGroupInput): CreateGroupParams {
  const params: CreateGroupParams = { name: input.name };
  if (input.group_type) params.group_type = input.group_type;
  if (input.simplify_by_default !== undefined) params.simplify_by_default = input.simplify_by_default;
  input.members?.forEach((m, i) => {
    if ("user_id" in m) {
      params[`users__${i}__user_id`] = m.user_id;
    } else {
      if (m.first_name) params[`users__${i}__first_name`] = m.first_name;
      if (m.last_name) params[`users__${i}__last_name`] = m.last_name;
      params[`users__${i}__email`] = m.email;
    }
  });
  return params;
}

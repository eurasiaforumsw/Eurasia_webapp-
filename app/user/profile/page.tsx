import { redirect } from "next/navigation";

/* /user/profile — friendly URL alias for /member/profile.
 * The avatar dropdown + share menu surface this shorter path, so a
 * server-side redirect preserves the existing rich profile UI. */

export default function UserProfileAlias() {
  redirect("/member/profile");
}
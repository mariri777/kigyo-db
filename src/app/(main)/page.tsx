import { redirect } from "next/navigation";

/**
 * 旧トップは現在再構築中。新トップ /v2 へリダイレクトする。
 * URL "/" 自体は将来の v3 立ち上げで再利用する想定。
 */
export default function RootRedirect(): never {
  redirect("/v2");
}

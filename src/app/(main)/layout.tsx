/**
 * 旧公開サイトの layout。再構築中につき chrome を持たず、children のみ素通し。
 * 現状の (main) ルートは "/" だけで、それも /v2 にリダイレクトする。
 */
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

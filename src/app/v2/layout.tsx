import { V2Header } from "./_Header";
import { V2Footer } from "./_Footer";

export default function V2Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <V2Header />
      <main className="flex-1">{children}</main>
      <V2Footer />
    </>
  );
}

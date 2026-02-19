import { Footer } from "~/modules/marketing/layout/footer";
import { Header } from "~/modules/marketing/layout/header";

export default function MainLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="w-full">{props.children}</main>
      <Footer />
    </>
  );
}

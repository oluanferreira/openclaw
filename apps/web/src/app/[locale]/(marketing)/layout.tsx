export default function MainLayout(props: { children: React.ReactNode }) {
  return (
    <>
      {/* <Header /> */}
      <main className="w-full">{props.children}</main>
      {/* <Footer /> */}
    </>
  );
}

export const metadata = {
  title: "Księga Domostwa",
  description: "Gildyjna księga obowiązków domowych"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}

export default function Head() {
  return (
    <>
      {/* override default favicon with a tiny transparent SVG data URI */}
      <link
        rel="icon"
        href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
      />
      <meta name="theme-color" content="#ffffff" />
    </>
  );
}
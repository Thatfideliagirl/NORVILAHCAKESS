// Phase 2: the full menu experience described in the brief section 10
// (category filters, one product per row, a focused product view with
// previous/next browsing, scroll-position-preserving close). Left as a
// deliberately empty route for now so section 2's "View Full Menu" and
// every "Shop Now" / "Order Now" link has somewhere real to go.
export default function MenuPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <p className="font-display text-heading text-berry">
        The full menu is on its way.
      </p>
    </main>
  );
}

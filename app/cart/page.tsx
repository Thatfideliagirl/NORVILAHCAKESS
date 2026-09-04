// Phase 2: a real cart view backed by the store in store/cart.ts. Left
// empty for now, same as /menu, so the nav's cart icon has somewhere to
// go instead of 404ing.
export default function CartPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <p className="font-display text-heading text-berry">
        Your cart is empty.
      </p>
    </main>
  );
}

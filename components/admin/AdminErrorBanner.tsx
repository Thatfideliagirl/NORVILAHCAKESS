export default function AdminErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-panel bg-berry/10 px-4 py-3 font-body text-small text-berry">
      Could not load this data: {message}
    </div>
  );
}

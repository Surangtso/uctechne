// The address only shows in a black banner on hover or focus (tap on touch screens); it is split
// into parts so a plain-text scan of the page source does not find it as one address.
export function ContactEmail({ label }: { label: string }) {
  return (
    <span className="group relative inline-block cursor-default" tabIndex={0}>
      <span className="underline decoration-dotted underline-offset-2">{label}</span>
      <span
        role="tooltip"
        className="invisible absolute bottom-full left-0 z-30 pb-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <span className="block whitespace-nowrap rounded-md bg-black px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/20">
          <span>surangne</span>
          <span>@</span>
          <span>gmail.com</span>
        </span>
      </span>
    </span>
  );
}

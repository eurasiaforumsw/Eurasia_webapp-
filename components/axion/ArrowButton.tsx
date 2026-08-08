import { ArrowRight } from "lucide-react";

export function ArrowButton({
  children,
  href,
  dark = false,
}: {
  children: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <a
      className={"arrow-button " + (dark ? "arrow-button--dark" : "")}
      href={href}
      aria-label={children}
    >
      <span className="text-roll" aria-hidden="true">
        <span>{children}</span>
        <span>{children}</span>
      </span>
      <span className="arrow-button__icon" aria-hidden="true">
        <ArrowRight size={16} strokeWidth={1.8} />
      </span>
    </a>
  );
}

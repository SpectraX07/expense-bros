import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LOGO = {
  src: "/logo.png",
  width: 1254,
  height: 1254,
} as const;

export function Brand({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  if (size === "sm") {
    return (
      <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-2", className)}>
        <Image
          src={LOGO.src}
          alt=""
          width={80}
          height={80}
          className="size-10 shrink-0 rounded-xl object-cover object-[center_32%] ring-1 ring-white/15"
        />
        <span className="font-heading truncate text-base font-semibold tracking-tight">
          {APP_NAME}
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" className={cn("block w-full max-w-56", className)}>
      <Image
        src={LOGO.src}
        alt={APP_NAME}
        width={LOGO.width}
        height={LOGO.height}
        priority
        className="h-auto w-full rounded-2xl"
      />
    </Link>
  );
}

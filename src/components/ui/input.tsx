import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-white placeholder:text-black/40 file:text-foreground selection:bg-[#00D1FF] selection:text-white h-12 w-full min-w-0 rounded-xl border-[4px] border-black px-4 py-3 text-base font-bold shadow-[4px_4px_0_rgba(0,0,0,1)] outline-none transition-shadow file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus:shadow-[2px_2px_0_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

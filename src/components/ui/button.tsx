import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-black uppercase tracking-wide border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: "bg-[#00D1FF] text-white",
        destructive:
          "bg-[#FF6B9D] text-white",
        outline:
          "bg-white text-black",
        secondary:
          "bg-[#FFD93D] text-black",
        ghost:
          "bg-transparent border-transparent shadow-none hover:bg-white/10",
        link: "text-[#00D1FF] border-transparent shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 py-3 has-[>svg]:px-6",
        sm: "h-10 rounded-full gap-1.5 px-6 has-[>svg]:px-4",
        lg: "h-14 rounded-full px-10 has-[>svg]:px-8 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

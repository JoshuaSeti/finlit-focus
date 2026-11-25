import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight ring-offset-background select-none touch-manipulation transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96] active:brightness-[0.96]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_3px_10px_-2px_hsl(var(--primary)/0.35)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_6px_16px_-4px_hsl(var(--primary)/0.45)] hover:brightness-[1.03]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_2px_8px_-2px_hsl(var(--destructive)/0.3)] hover:brightness-[1.04]",
        outline:
          "border border-border/80 bg-background/80 backdrop-blur-md text-foreground shadow-sm hover:bg-accent/60 hover:text-accent-foreground active:bg-accent",
        secondary:
          "bg-secondary/90 text-secondary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-sm hover:bg-secondary",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground active:bg-accent/80",
        link:
          "text-primary underline-offset-4 hover:underline active:opacity-70",
        hero:
          "bg-primary text-primary-foreground font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_20px_-4px_hsl(var(--primary)/0.45)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_12px_24px_-4px_hsl(var(--primary)/0.5)] hover:scale-[1.01] active:scale-[0.96]",
        heroOutline:
          "border border-primary/40 bg-primary/5 text-primary backdrop-blur-md hover:bg-primary/10 active:bg-primary/15",
        subtle:
          "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-full",
        sm: "h-9 rounded-full px-3.5 text-xs",
        lg: "h-12 rounded-full px-7 text-base",
        xl: "h-14 rounded-full px-9 text-lg",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

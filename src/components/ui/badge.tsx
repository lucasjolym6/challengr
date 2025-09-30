import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Challenge category variants
        sports: "border-transparent bg-sports/10 text-sports border-sports/20",
        drawing: "border-transparent bg-drawing/10 text-drawing border-drawing/20",
        music: "border-transparent bg-music/10 text-music border-music/20",
        cooking: "border-transparent bg-cooking/10 text-cooking border-cooking/20",
        writing: "border-transparent bg-writing/10 text-writing border-writing/20",
        coding: "border-transparent bg-coding/10 text-coding border-coding/20",
        gardening: "border-transparent bg-gardening/10 text-gardening border-gardening/20",
        // Challenge status variants
        "to-do": "border-transparent bg-muted text-muted-foreground",
        "in-progress": "border-transparent bg-accent/10 text-accent border-accent/20",
        completed: "border-transparent bg-success/10 text-success border-success/20",
        // Challenge type variants
        company: "border-transparent bg-primary/10 text-primary border-primary/20",
        community: "border-transparent bg-secondary/10 text-secondary border-secondary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

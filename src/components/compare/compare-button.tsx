"use client";

import { useCompare, type CompareProgram } from "./compare-context";
import { Button } from "@/components/ui/button";

interface CompareButtonProps {
  program: CompareProgram;
  size?: "sm" | "md";
}

export function CompareButton({ program, size = "sm" }: CompareButtonProps) {
  const { add, remove, has, isFull } = useCompare();
  const isAdded = has(program.id);

  function handleClick() {
    if (isAdded) {
      remove(program.id);
    } else {
      add(program);
    }
  }

  return (
    <Button
      variant={isAdded ? "primary" : "secondary"}
      size={size}
      onClick={handleClick}
      disabled={!isAdded && isFull}
    >
      {isAdded ? "Remove from compare" : "Compare"}
    </Button>
  );
}

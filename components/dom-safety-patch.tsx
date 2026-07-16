"use client";

if (typeof window !== "undefined" && typeof Node !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  (Node.prototype as any).removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}

export default function DomSafetyPatch() {
  return null;
}

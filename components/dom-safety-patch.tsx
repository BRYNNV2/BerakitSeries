"use client";

if (typeof window !== "undefined" && typeof Node !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  (Node.prototype as any).removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      return child;
    }
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch (err) {
      console.warn("Node.removeChild error ignored:", err);
      return child;
    }
  };
}

export default function DomSafetyPatch() {
  return null;
}

import type { Metadata } from "next"

import { TodoApp } from "@/components/todo/todo-app"

export const metadata: Metadata = {
  title: "TODO marker lab",
  description:
    "Scan ripgrep output for TODO, FIXME, HACK, XXX, and BUG markers with copyable paths.",
}

export default function TodoPage() {
  return <TodoApp />
}

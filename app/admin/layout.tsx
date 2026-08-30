import type { ReactNode } from "react";
import "./index.css";
import "./App.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-scope">{children}</div>;
}

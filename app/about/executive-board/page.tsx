import type { Metadata } from "next";
import ExecutiveBoardPage from "@/components/efsw/ExecutiveBoardPage";

export const metadata: Metadata = {
  title: "Executive Board | Eurasia Forum for Social Workers",
  description:
    "Meet the Executive Board leading the Eurasia Forum for Social Workers — practitioners, students, and institutional partners from across Eurasia.",
};

export default function Page() {
  return <ExecutiveBoardPage />;
}
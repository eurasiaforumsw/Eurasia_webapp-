import type { Metadata } from "next";
import OrganizationPage from "@/components/efsw/OrganizationPage";

export const metadata: Metadata = {
  title: "Organization | Eurasia Forum for Social Workers",
  description: "The structure and roles that hold the EFSW network together.",
};

export default function Page() {
  return <OrganizationPage />;
}

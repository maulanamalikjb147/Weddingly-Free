import { fetchConfig } from "@/lib/config";
import ClientHomeWrapper from "./[slug]/ClientHomeWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const config = await fetchConfig();

  return <ClientHomeWrapper slug="" guest={null} config={config} />;
}

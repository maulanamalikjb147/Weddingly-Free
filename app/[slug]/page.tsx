import { fetchConfig } from "@/lib/config";
import { getWeddingGuest } from "@/lib/guest";
import ClientHomeWrapper from "./ClientHomeWrapper";

type ParamsProps = {
  params: { slug: string };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home({ params: { slug } }: ParamsProps) {
  const [config, guest] = await Promise.all([
    fetchConfig(),
    getWeddingGuest(decodeURIComponent(slug)),
  ]);

  return <ClientHomeWrapper slug={slug} guest={guest} config={config} />;
}

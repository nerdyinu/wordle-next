import Game from "@/components/Game";
import { getGameView } from "@/lib/game.service";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";

export default async function GamePage(props: { params: Promise<{ hash: string }> }) {
  const { hash: rawHash } = await props.params;
  const hash = decodeURIComponent(rawHash);

  const queryClient = new QueryClient();
  // fetchQuery waits for the fetch, stores the result under the key, and returns it.
  // Unlike prefetchQuery it throws on failure, so a DB outage reaches the error page.
  const game = await queryClient.fetchQuery({
    queryKey: ['gameState', hash],            // same key Game.tsx uses
    queryFn: () => getGameView(hash),
  });
  if (!game) notFound();                      // bad or expired link → 404

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Game gameHash={hash} />
    </HydrationBoundary>
  );
}

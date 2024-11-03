import Game from "@/components/Game";
import { fetchStatistics, getGameState } from "@/lib/api";
import { getDehydratedQueries, Hydrate } from "@/lib/query";

export default async function GamePage(props: { params: Promise<{ hash: string }> }) {
  const params = await props.params;

  const decodedGameHash = params.hash ? decodeURIComponent(params.hash) : null;
  const dehydratedState = await getDehydratedQueries([{
    queryKey: ['gameState', decodedGameHash],
    queryFn: () => getGameState(decodedGameHash!),
  },
  {
    queryKey: ["statistics"],
    queryFn: () => fetchStatistics()
  }])

  return (
    <Hydrate state={[dehydratedState]}>
      <Game gameHash={params.hash} />
    </Hydrate>
  )
}

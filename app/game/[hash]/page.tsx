import Game from "@/components/Game";
import { fetchStatistics, getGameState } from "@/lib/api";
import { getDehydratedQueries, Hydrate } from "@/lib/query";

export default async function GamePage(props: { params: Promise<{ hash: string }> }) {
  const params = await props.params;
  console.log("gamepage")
  const decodedGameHash = decodeURIComponent(params.hash)
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
      <Game gameHash={decodedGameHash} />
    </Hydrate>
  )
}

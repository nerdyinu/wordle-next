import Game from "@/components/Game";
import Loader from "@/components/Loader";
import { fetchStatistics, getGameState } from "@/lib/api";
import { getDehydratedSuspenseQueries, Hydrate } from "@/lib/query";
import { Suspense } from "react";

export default async function GamePage(props: { params: Promise<{ hash: string }> }) {
  const params = await props.params;
  console.log("gamepage")
  const decodedGameHash = decodeURIComponent(params.hash)
  const queries = getDehydratedSuspenseQueries([{
    queryKey: ['gameState', decodedGameHash],
    queryFn: () => getGameState(decodedGameHash!),
  },
  {
    queryKey: ["statistics"],
    queryFn: () => fetchStatistics()
  }])

  return (
    <Hydrate state={{ queries }} >
      <Suspense fallback={<Loader />}>
        <Game gameHash={decodedGameHash} />
      </Suspense>
    </ Hydrate>
  )
}

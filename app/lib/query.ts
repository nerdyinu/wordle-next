import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  QueryKey,
  QueryState
} from '@tanstack/react-query';
import { cache } from 'react';


export const getServerQueryClient = cache(() => new QueryClient());

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

interface QueryProps<ResponseType = unknown> {
  queryKey: QueryKey;
  queryFn: () => Promise<ResponseType>;
}

interface DehydratedQueryExtended<TData = unknown, TError = unknown> {
  state: QueryState<TData, TError>;
}

export async function getDehydratedQuery<Q extends QueryProps>({
  queryKey,
  queryFn,
}: Q) {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery({ queryKey, queryFn });

  const { queries } = dehydrate(queryClient);
  const [dehydratedQuery] = queries.filter((query) =>
    query.queryKey === queryKey
  );

  return dehydratedQuery as DehydratedQueryExtended<
    UnwrapPromise<ReturnType<Q['queryFn']>>
  >;
}

export function getDehydratedSuspenseQuery<Q extends QueryProps>({ queryKey, queryFn }: Q) {
  const queryClient = getServerQueryClient();
  queryClient.prefetchQuery({ queryKey, queryFn });
  const { queries } = dehydrate(queryClient);
  const [dehydratedQuery] = queries.filter((query) =>
    query.queryKey === queryKey
  );
  return dehydratedQuery as DehydratedQueryExtended<ReturnType<Q['queryFn']>>
}
export function getDehydratedSuspenseQueries<Q extends QueryProps[]>(queries: Q) {
  const queryClient = getServerQueryClient();
  Promise.all(
    queries.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({ queryKey, queryFn }),
    ),
  );

  return dehydrate(queryClient).queries as DehydratedQueryExtended<
    ReturnType<Q[number]['queryFn']>
  >[];
}


export async function getDehydratedQueries<Q extends QueryProps[]>(queries: Q) {
  const queryClient = getServerQueryClient();
  await Promise.all(
    queries.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({ queryKey, queryFn }),
    ),
  );

  return dehydrate(queryClient).queries as DehydratedQueryExtended<
    UnwrapPromise<ReturnType<Q[number]['queryFn']>>
  >[];
}
export const Hydrate = HydrationBoundary;

export default {};

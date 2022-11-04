import {
  notifyManager,
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { SUBSCRIPTION } from './utils';

export function baseQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData
>(
  client: QueryClient,
  Observer: typeof QueryObserver,
  options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>
) {
  const defaultedOptions = client.defaultQueryOptions(options);
  defaultedOptions._optimisticResults = 'optimistic';

  defaultedOptions.onError &&= notifyManager.batchCalls(
    defaultedOptions.onError
  );

  defaultedOptions.onSuccess &&= notifyManager.batchCalls(
    defaultedOptions.onSuccess
  );

  defaultedOptions.onSettled &&= notifyManager.batchCalls(
    defaultedOptions.onSettled
  );

  const queryObserver = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    QueryKey
  >(client, defaultedOptions);

  // console.log('NEW OBSERVER INSTANCE');

  (queryObserver as unknown as { result$: Observable<unknown> }).result$ =
    new Observable<QueryObserverResult<TData, TError>>((observer) => {
      const mergedOptions = client.defaultQueryOptions({
        ...options,
        // The query key can be changed, so we need to rebuild it each time
        ...queryObserver.options,
      });

      // console.log(
      //   'NEW OBSERVER SUBSCRIPTION',
      //   queryObserver.getCurrentQuery().queryKey
      // );

      observer.next(queryObserver.getOptimisticResult(mergedOptions));

      const queryObserverDispose = queryObserver.subscribe((result) => {
        observer.next(
          !defaultedOptions.notifyOnChangeProps
            ? queryObserver.trackResult(result)
            : result
        );
      });

      return () => {
        // console.log(
        //   'OBSERVER UNSUBSCRIBED ',
        //   queryObserver.getCurrentQuery().queryKey
        // );

        (mergedOptions as any)['queryFn']?.[SUBSCRIPTION]?.unsubscribe();
        queryObserverDispose();
      };
    }).pipe(
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );

  return queryObserver;
}

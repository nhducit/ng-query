import { QueryObserverResult } from '@tanstack/query-core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export function filterError() {
  return function (
    source: Observable<QueryObserverResult<null>>
  ): Observable<QueryObserverResult<null>> {
    return source.pipe(
      filter(
        (result): result is QueryObserverResult<null> =>
          result.status === 'error' && result.data === null
      )
    );
  };
}

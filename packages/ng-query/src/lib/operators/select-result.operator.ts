import { OperatorFunction, pipe } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

// rethink about the name
export function selectResult<T, R>(
  mapFn: (result: T) => R
): OperatorFunction<T, R> {
  return pipe(map(mapFn), distinctUntilChanged());
}

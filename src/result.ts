import { match, Matchable, matchSymbol, Patterns } from './match';
import { none, None, Option, some, Some } from './option';

interface BaseResult<T, TErr> extends Matchable<{ ok: [T]; err: [TErr] }> {
    isOk: () => this is Ok<T>;
    isErr: () => this is Err<TErr>;
    unwrap: () => T;
    unwrapOr: <U>(defaultValue: U) => T | U;
    unwrapOrElse: <U>(callback: () => U) => T | U;
    check: (callback: (value: T) => boolean) => boolean;
    map: <U>(callback: (value: T) => U) => Result<U, TErr>;
    mapErr: <UErr>(callback: (error: TErr) => UErr) => Result<T, UErr>;
    toOption: () => Option<T>;
    toOptionErr: () => Option<TErr>;
}

export interface Ok<T> extends BaseResult<T, never> {
    isOk: () => true;
    isErr: () => false;
    unwrapOr: <U>(defaultValue: U) => T;
    unwrapOrElse: <U>(callback: () => U) => T;
    check: (callback: (value: T) => boolean) => boolean;
    map: <U>(callback: (value: T) => U) => Ok<U>;
    mapErr: <UErr>(callback: (error: never) => UErr) => Ok<T>;
    toOption: () => Some<T>;
    toOptionErr: () => None;
}

export interface Err<TErr> extends BaseResult<never, TErr> {
    isOk: () => false;
    isErr: () => true;
    check: (callback: (value: never) => boolean) => false;
    map: <U>(callback: (value: never) => U) => Err<TErr>;
    mapErr: <UErr>(callback: (error: TErr) => UErr) => Err<UErr>;
    toOption: () => None;
    toOptionErr: () => Some<TErr>;
}

export type Result<T, TErr> = Ok<T> | Err<TErr>;

export type UnwrapResult<TResult extends Result<any, any>> = TResult extends Ok<infer T>
    ? T
    : never;

export class ErrUnwrapError extends Error {
    constructor() {
        super('called `Result::unwrap()` on an `Err` value');
    }
}

export class ResultImpl<T, TErr> implements BaseResult<T, TErr> {
    readonly #type: 'ok' | 'err';
    readonly #data: T | TErr;
    private constructor(type: 'ok' | 'err', data: T | TErr) {
        this.#type = type;
        this.#data = data;
    }
    static ok = <T>(value: T): Ok<T> => new this('ok', value) as unknown as Ok<T>;
    static err = <TErr>(error: TErr): Err<TErr> => new this('err', error) as unknown as Err<TErr>;

    [matchSymbol](): ['ok', [T]] | ['err', [TErr]] {
        if (this.#type === 'err') {
            return ['err', [this.#data as TErr]];
        }
        return ['ok', [this.#data as T]];
    }
    match<U>(patterns: Patterns<{ ok: [T]; err: [TErr] }, U>): U {
        return match(this, patterns);
    }

    isOk(): this is Ok<T> {
        return this.#type === 'ok';
    }
    isErr(): this is Err<TErr> {
        return this.#type === 'err';
    }

    unwrap(): T {
        if (this.#type === 'err') {
            throw new ErrUnwrapError();
        }
        return this.#data as T;
    }
    unwrapOr<U>(defaultValue: U): T | U {
        if (this.#type === 'err') {
            return defaultValue;
        }
        return this.#data as T;
    }
    unwrapOrElse<U>(callback: () => U): T | U {
        if (this.#type === 'err') {
            return callback();
        }
        return this.#data as T;
    }

    check(callback: (value: T) => boolean): boolean {
        if (this.#type === 'err') {
            return false;
        }
        return callback(this.#data as T);
    }
    map<U>(callback: (value: T) => U): Result<U, TErr> {
        if (this.#type === 'err') {
            return err(this.#data as TErr);
        }
        return ok(callback(this.#data as T));
    }
    mapErr<UErr>(callback: (error: TErr) => UErr): Result<T, UErr> {
        if (this.#type === 'err') {
            return err(callback(this.#data as TErr));
        }
        return ok(this.#data as T);
    }

    toOption(): Option<T> {
        if (this.#type === 'err') {
            return none;
        }
        return some(this.#data as T);
    }
    toOptionErr(): Option<TErr> {
        if (this.#type === 'err') {
            return some(this.#data as TErr);
        }
        return none;
    }
}

export const { ok, err } = ResultImpl;

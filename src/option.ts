import { match, Matchable, matchSymbol, Patterns } from './match';
import { err, Err, ok, Ok, Result } from './result';

interface BaseOption<T> extends Matchable<{ some: [T]; none: [] }> {
    isSome: () => this is Some<T>;
    isNone: () => this is None;
    unwrap: () => T;
    unwrapOr: <U>(defaultValue: U) => T | U;
    unwrapOrElse: <U>(callback: () => U) => T | U;
    check: (callback: (value: T) => boolean) => boolean;
    filter: <U extends T>(callback: (value: T) => value is U) => Option<U>;
    map: <U>(callback: (value: T) => U) => Option<U>;
    toResult: <TErr>(error: TErr) => Result<T, TErr>;
    toResultElse: <TErr>(callback: () => TErr) => Result<T, TErr>;
}

export interface Some<T> extends BaseOption<T> {
    isSome: () => true;
    isNone: () => false;
    unwrapOr: <U>(defaultValue: U) => T;
    unwrapOrElse: <U>(callback: () => U) => T;
    map: <U>(callback: (value: T) => U) => Some<U>;
    toResult: <TErr>(error: TErr) => Ok<T>;
    toResultElse: <TErr>(callback: () => TErr) => Ok<T>;
}

export interface None extends BaseOption<never> {
    isSome: () => false;
    isNone: () => true;
    check: (callback: (value: never) => boolean) => false;
    filter: (callback: (value: never) => boolean) => None;
    map: <U>(callback: (value: never) => U) => None;
    toResult: <TErr>(error: TErr) => Err<TErr>;
    toResultElse: <TErr>(callback: () => TErr) => Err<TErr>;
}

export type Option<T> = Some<T> | None;

export type UnwrapOption<TOption extends Option<any>> = TOption extends Some<infer T> ? T : never;

const noneValue = Symbol('none');

export class NoneUnwrapError extends Error {
    constructor() {
        super('called `Option::unwrap()` on a `None` value');
    }
}

export class OptionImpl<T> implements BaseOption<T> {
    readonly #value: T | typeof noneValue;
    protected constructor(value: T | typeof noneValue) {
        this.#value = value;
    }
    static some = <T>(value: T): Some<T> => {
        return new this(value) as Some<T>;
    };
    static none: None = new this(noneValue) as unknown as None;

    [matchSymbol](): ['some', [T]] | ['none', []] {
        if (this.#value === noneValue) {
            return ['none', []];
        }
        return ['some', [this.#value]];
    }
    match<U>(patterns: Patterns<{ some: [T]; none: [] }, U>): U {
        return match(this, patterns);
    }

    isSome(): this is Some<T> {
        return this.#value !== noneValue;
    }
    isNone(): this is None {
        return this.#value === noneValue;
    }

    unwrap(): T {
        if (this.#value === noneValue) {
            throw new NoneUnwrapError();
        }
        return this.#value;
    }
    unwrapOr<U>(defaultValue: U): T | U {
        if (this.#value === noneValue) {
            return defaultValue;
        }
        return this.#value;
    }
    unwrapOrElse<U>(callback: () => U): T | U {
        if (this.#value === noneValue) {
            return callback();
        }
        return this.#value;
    }

    check(callback: (value: T) => boolean): boolean {
        if (this.#value === noneValue) {
            return false;
        }
        return callback(this.#value);
    }
    filter<U extends T>(callback: (value: T) => value is U): Option<U> {
        if (this.#value === noneValue || !callback(this.#value)) {
            return none;
        }
        return this as unknown as Option<U>;
    }
    map<U>(callback: (value: T) => U): Option<U> {
        if (this.#value === noneValue) {
            return none;
        }
        return some(callback(this.#value));
    }

    toResult<TErr>(error: TErr): Result<T, TErr> {
        if (this.#value === noneValue) {
            return err(error);
        }
        return ok(this.#value);
    }

    toResultElse<TErr>(callback: () => TErr): Result<T, TErr> {
        if (this.#value === noneValue) {
            return err(callback());
        }
        return ok(this.#value);
    }
}

export const { some, none } = OptionImpl;

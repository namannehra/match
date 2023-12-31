export const defaultKey = '_';
export const matchSymbol = Symbol('match');

export interface Matchable<TShape extends Record<any, any[]>> {
    [matchSymbol]: () => { [Key in keyof TShape]: [Key, TShape[Key]] }[keyof TShape];
    match: <TResult>(patterns: Patterns<TShape, TResult>) => TResult;
}

export type PatternsWithoutDefault<TShape extends Record<any, any[]>, TResult> = {
    [Key in keyof TShape]: (...args: TShape[Key]) => TResult;
};

export type PatternsWithDefault<TShape extends Record<any, any[]>, TResult> = Partial<
    PatternsWithoutDefault<TShape, TResult>
> & { [defaultKey]: () => TResult };

export type Patterns<TShape extends Record<any, any[]>, TResult> =
    | PatternsWithoutDefault<TShape, TResult>
    | PatternsWithDefault<TShape, TResult>;

export const match = <TShape extends Record<any, any[]>, TResult>(
    value: Matchable<TShape>,
    patterns: Patterns<TShape, TResult>,
): TResult => {
    const [key, args] = value[matchSymbol]();
    if (!patterns[key]) {
        return patterns[defaultKey]();
    }
    return patterns[key]!(...args);
};

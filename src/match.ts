export const defaultKey = '_';
export const matchSymbol = Symbol('match');

export interface Matchable<TShape extends Record<any, any[]>> {
    [matchSymbol]: () => { [key in keyof TShape]: [key, TShape[key]] }[keyof TShape];
    match: <TResult>(patterns: Patterns<TShape, TResult>) => TResult;
}

export type PatternsWithoutDefault<TShape extends Record<any, any[]>, TResult> = {
    [key in keyof TShape]: (...args: TShape[key]) => TResult;
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

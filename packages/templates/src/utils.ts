export const compose = <R>(...functions: Array<(a: R) => R>) => {
  const [fn1, ...fns] = functions;
  return fns.reduce((prevFn, nextFn) => value => prevFn(nextFn(value)), fn1);
};

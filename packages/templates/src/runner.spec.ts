import runner from './runner';
describe('runner', () => {
  it('fails if no templatefolders found', () => {
    return expect(runner([], {})).rejects.toThrow();
  });
});

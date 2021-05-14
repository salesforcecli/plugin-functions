// apollo boost is not compatable with TS 3.6+
// the following is a workaround
// https://github.com/apollographql/apollo-client/issues/5373
declare type GlobalFetch = {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
};

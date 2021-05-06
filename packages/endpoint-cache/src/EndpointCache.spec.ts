import { LRUCache } from "mnemonist";

import { Endpoint } from "./Endpoint";
import { EndpointCache } from "./EndpointCache";

jest.mock("mnemonist");

describe(EndpointCache.name, () => {
  let endpointCache;
  const capacity = 100;
  const key = "key";

  const now = Date.now();
  const set = jest.fn();
  const get = jest.fn();
  const has = jest.fn();
  const clear = jest.fn();

  const mockEndpoints = [
    { Address: "addressA", CachePeriodInMinutes: 1 },
    { Address: "addressB", CachePeriodInMinutes: 2 },
  ];

  const getEndpointsWithExpiry = (endpoints: Endpoint[]) =>
    endpoints.map(({ Address = "", CachePeriodInMinutes = 1 }) => ({
      Address,
      Expires: now + CachePeriodInMinutes * 60 * 1000,
    }));

  const getMaxCachePeriodInMins = (endpoints: Endpoint[]) =>
    Math.max(...endpoints.map((endpoint) => endpoint.CachePeriodInMinutes));

  beforeEach(() => {
    ((LRUCache as unknown) as jest.Mock).mockReturnValueOnce({
      set,
      get,
      has,
      clear,
    });
    endpointCache = new EndpointCache(capacity);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes capacity to LRUCache", () => {
    expect(LRUCache).toHaveBeenCalledTimes(1);
    expect(LRUCache).toHaveBeenCalledWith(capacity);
  });

  describe("get", () => {
    beforeEach(() => {
      has.mockReturnValue(true);
      get.mockReturnValue(getEndpointsWithExpiry(mockEndpoints));
      jest.spyOn(Date, "now").mockImplementation(() => now);
    });

    const verifyHasAndGetCalls = () => {
      expect(has).toHaveBeenCalledTimes(1);
      expect(has).toHaveBeenCalledWith(key);
      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(key);
    };

    it("returns undefined if cache doesn't have key", () => {
      has.mockReturnValueOnce(false);
      expect(endpointCache.get(key)).toBeUndefined();
      expect(has).toHaveBeenCalledTimes(1);
      expect(has).toHaveBeenCalledWith(key);
      expect(get).not.toHaveBeenCalled();
    });

    it("returns undefined if cache returns undefined for key", () => {
      get.mockReturnValueOnce(undefined);
      expect(endpointCache.get(key)).toBeUndefined();
      verifyHasAndGetCalls();
      expect(set).not.toHaveBeenCalled();
    });

    it("returns undefined if endpoints have expired", () => {
      const maxCachePeriod = getMaxCachePeriodInMins(mockEndpoints);
      jest.spyOn(Date, "now").mockImplementation(() => now + (maxCachePeriod + 1) * 60 * 1000);
      expect(endpointCache.get(key)).toBeUndefined();
      verifyHasAndGetCalls();
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith(key, []);
    });

    it("returns one of the un-expired endpoints", () => {
      expect(mockEndpoints.map((endpoint) => endpoint.Address)).toContain(endpointCache.get(key));
      verifyHasAndGetCalls();
      expect(set).not.toHaveBeenCalled();
    });

    it("returns un-expired endpoint", () => {
      jest.spyOn(Date, "now").mockImplementation(() => now + 90 * 1000);
      expect(endpointCache.get(key)).toEqual(mockEndpoints[1].Address);
      verifyHasAndGetCalls();
      expect(set).not.toHaveBeenCalled();
    });

    [0, 1].forEach((index) => {
      it(`returns un-expired endpoint at index ${index}`, () => {
        jest.spyOn(Math, "floor").mockImplementation(() => index);
        expect(mockEndpoints.map((endpoint) => endpoint.Address)).toContain(endpointCache.get(key));
        verifyHasAndGetCalls();
        expect(set).not.toHaveBeenCalled();
      });
    });
  });

  describe("set", () => {
    beforeEach(() => {
      jest.spyOn(Date, "now").mockImplementation(() => now);
    });

    it("converts CachePeriodInMinutes to Expires before caching", () => {
      endpointCache.set(key, mockEndpoints);
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith(
        key,
        mockEndpoints.map(({ Address, CachePeriodInMinutes }) => ({
          Address,
          Expires: now + CachePeriodInMinutes * 60 * 1000,
        }))
      );
    });

    it("sets Address to empty string if not passed", () => {
      const mockEnpointsNoAddr = [{ CachePeriodInMinutes: 1 }];
      endpointCache.set(key, mockEnpointsNoAddr);
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith(key, [{ Address: "", Expires: now + 60 * 1000 }]);
    });

    it("sets Expires in one minute if CachePeriodInMinutes is not passed", () => {
      const mockEnpointsNoAddr = [{ Address: "address" }];
      endpointCache.set(key, mockEnpointsNoAddr);
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith(key, [{ Address: "address", Expires: now + 60 * 1000 }]);
    });
  });

  it("delete", () => {
    endpointCache.delete(key);
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(key, []);
  });

  it("has", () => {
    endpointCache.has(key);
    expect(has).toHaveBeenCalledTimes(1);
    expect(has).toHaveBeenCalledWith(key);
  });

  it("clear", () => {
    endpointCache.clear();
    expect(clear).toHaveBeenCalledTimes(1);
  });
});

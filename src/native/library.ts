import { load } from "koffi";
import { resolveNativeLibraryPath } from "./downloader";
import type { NativeLibrary } from "./types";

let cachedLibrary: NativeLibrary | undefined;
let cachedInitializer: Promise<NativeLibrary> | undefined;

export const getNativeLibrary = async (): Promise<NativeLibrary> => {
  if (cachedLibrary) {
    return cachedLibrary;
  }

  if (!cachedInitializer) {
    cachedInitializer = createNativeLibrary();
  }

  cachedLibrary = await cachedInitializer;
  return cachedLibrary;
};

const createNativeLibrary = async (): Promise<NativeLibrary> => {
  const libraryPath = await resolveNativeLibraryPath();
  const ffiLib = load(libraryPath);

  return {
    request: ffiLib.func("request", "str", ["str"]) as NativeLibrary["request"],
    freeMemory: ffiLib.func("freeMemory", "void", ["str"]) as NativeLibrary["freeMemory"],
    destroySession: ffiLib.func(
      "destroySession",
      "str",
      ["str"]
    ) as NativeLibrary["destroySession"],
    destroyAll: ffiLib.func("destroyAll", "str", []) as NativeLibrary["destroyAll"],
  };
};

export const resetNativeLibraryCacheForTests = (): void => {
  cachedLibrary = undefined;
  cachedInitializer = undefined;
};

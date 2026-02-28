import { UnsupportedPlatformError } from "../core/errors";

interface PlatformAssetMapValue {
  cacheName: string;
  remoteNamePattern: string;
}

const PLATFORM_ASSET_MAP: Record<
  NodeJS.Platform,
  Record<string, PlatformAssetMapValue>
> = {
  darwin: {
    arm64: {
      cacheName: "tls-client-darwin-arm64.dylib",
      remoteNamePattern: "tls-client-darwin-arm64-{version}.dylib",
    },
    x64: {
      cacheName: "tls-client-darwin-amd64.dylib",
      remoteNamePattern: "tls-client-darwin-amd64-{version}.dylib",
    },
  },
  linux: {
    arm64: {
      cacheName: "tls-client-linux-arm64.so",
      remoteNamePattern: "tls-client-linux-arm64-{version}.so",
    },
    x64: {
      cacheName: "tls-client-linux-ubuntu-amd64.so",
      remoteNamePattern: "tls-client-linux-ubuntu-amd64-{version}.so",
    },
  },
  win32: {
    ia32: {
      cacheName: "tls-client-windows-32.dll",
      remoteNamePattern: "tls-client-windows-32-{version}.dll",
    },
    x64: {
      cacheName: "tls-client-windows-64.dll",
      remoteNamePattern: "tls-client-windows-64-{version}.dll",
    },
  },
  aix: {},
  android: {},
  freebsd: {},
  haiku: {},
  openbsd: {},
  netbsd: {},
  sunos: {},
  cygwin: {},
};

export interface PlatformBinaryInfo {
  cacheName: string;
  remoteNamePattern: string;
}

export const getPlatformBinaryInfo = (
  platform = process.platform,
  arch = process.arch
): PlatformBinaryInfo => {
  const platformEntry = PLATFORM_ASSET_MAP[platform];
  const asset = platformEntry?.[arch];
  if (!asset) {
    throw new UnsupportedPlatformError(platform, arch);
  }
  return asset;
};

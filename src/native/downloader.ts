import { createWriteStream } from "node:fs";
import { mkdir, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import { BinaryDownloadError } from "../core/errors";
import { getPlatformBinaryInfo } from "./platform";

const GITHUB_API_HOST = "api.github.com";
const RELEASES_PATH = "/repos/bogdanfinn/tls-client/releases/latest";

interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GithubReleaseResponse {
  tag_name: string;
  assets: GithubReleaseAsset[];
}

export const resolveNativeLibraryPath = async (): Promise<string> => {
  const explicitPath = process.env.TLS_CLIENT_NODE_BINARY_PATH;
  if (explicitPath) {
    return explicitPath;
  }

  const platformInfo = getPlatformBinaryInfo();
  const cacheDir =
    process.env.TLS_CLIENT_NODE_CACHE_DIR ??
    path.join(os.homedir(), ".cache", "tls-client-node");

  await mkdir(cacheDir, { recursive: true });
  const localFilePath = path.join(cacheDir, platformInfo.cacheName);

  if (await exists(localFilePath)) {
    return localFilePath;
  }

  const release = await fetchLatestRelease();
  const version = release.tag_name.replace(/^v/, "");
  const expectedAssetName = platformInfo.remoteNamePattern.replace("{version}", version);
  const asset = release.assets.find((candidate) => candidate.name === expectedAssetName);

  if (!asset) {
    throw new BinaryDownloadError(
      `Asset '${expectedAssetName}' not found in tls-client release ${release.tag_name}.`
    );
  }

  await downloadFile(asset.browser_download_url, localFilePath);
  return localFilePath;
};

const fetchLatestRelease = async (): Promise<GithubReleaseResponse> => {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: GITHUB_API_HOST,
        path: RELEASES_PATH,
        method: "GET",
        headers: {
          "User-Agent": "tls-client-node",
          Accept: "application/vnd.github+json",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new BinaryDownloadError(
                `Failed to fetch latest release metadata: HTTP ${response.statusCode}`
              )
            );
            return;
          }

          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as GithubReleaseResponse;
            resolve(parsed);
          } catch (error) {
            reject(new BinaryDownloadError("Unable to parse release metadata JSON.", error));
          }
        });
      }
    );

    request.on("error", (error) => reject(new BinaryDownloadError("Release metadata request failed.", error)));
    request.end();
  });
};

const downloadFile = async (url: string, outputPath: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        const redirectTarget = new URL(response.headers.location, url).toString();
        response.destroy();
        downloadFile(redirectTarget, outputPath).then(resolve, reject);
        return;
      }

      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        reject(new BinaryDownloadError(`Failed to download native library: HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      fileStream.on("error", (error) =>
        reject(new BinaryDownloadError("Failed writing native library binary.", error))
      );
    });

    request.on("error", (error) => reject(new BinaryDownloadError("Failed downloading native library.", error)));
  });
};

const exists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

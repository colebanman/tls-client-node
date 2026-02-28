import type { NativeCookie } from "./cookies";
import type { NormalizedRequestOptions } from "./types";
import type { NativeRequestPayload } from "../native/types";

export const buildNativePayload = (
  options: NormalizedRequestOptions,
  requestCookies: NativeCookie[]
): NativeRequestPayload => {
  const headerOrder = Object.keys(options.headers);

  return {
    sessionId: options.session.id,
    followRedirects: options.followRedirect,
    forceHttp1: options.tls.forceHttp1,
    disableHttp3: options.tls.disableHttp3,
    withProtocolRacing: options.tls.withProtocolRacing,
    disableIPV6: options.tls.disableIpv6,
    disableIPV4: options.tls.disableIpv4,
    headers: options.headers,
    headerOrder,
    insecureSkipVerify: options.tls.insecureSkipVerify,
    proxyUrl: options.proxyUrl ?? "",
    requestUrl: options.url,
    requestMethod: options.method,
    requestBody: options.body,
    requestCookies,
    timeoutMilliseconds: options.timeoutMs,
    withRandomTLSExtensionOrder: options.tls.randomTlsExtensionOrder,
    isByteRequest: options.isByteRequest,
    isByteResponse: options.responseType === "buffer",
    withDebug: false,
    withoutCookieJar: true,
    withCustomCookieJar: false,
    catchPanics: false,
    serverNameOverwrite: options.tls.serverNameOverwrite,
    tlsClientIdentifier: options.customTlsClient ? undefined : options.tls.clientIdentifier,
    customTlsClient: options.customTlsClient
      ? {
          ja3String: options.customTlsClient.ja3String,
          h2Settings: options.customTlsClient.h2Settings ?? {},
          h2SettingsOrder: options.customTlsClient.h2SettingsOrder ?? [],
          h3Settings: options.customTlsClient.h3Settings ?? {},
          h3SettingsOrder: options.customTlsClient.h3SettingsOrder ?? [],
          h3PseudoHeaderOrder: options.customTlsClient.h3PseudoHeaderOrder ?? [],
          h3PriorityParam: options.customTlsClient.h3PriorityParam ?? 0,
          h3SendGreaseFrames: options.customTlsClient.h3SendGreaseFrames ?? false,
          pseudoHeaderOrder: options.customTlsClient.pseudoHeaderOrder ?? [],
          connectionFlow: options.customTlsClient.connectionFlow ?? 0,
          headerPriority: options.customTlsClient.headerPriority,
          priorityFrames: options.customTlsClient.priorityFrames ?? [],
          certCompressionAlgos: options.customTlsClient.certCompressionAlgos ?? [],
          supportedSignatureAlgorithms:
            options.customTlsClient.supportedSignatureAlgorithms ?? [],
          supportedDelegatedCredentialsAlgorithms:
            options.customTlsClient.supportedDelegatedCredentialsAlgorithms ?? [],
          supportedVersions: options.customTlsClient.supportedVersions ?? [],
          keyShareCurves: options.customTlsClient.keyShareCurves ?? [],
          alpnProtocols: options.customTlsClient.alpnProtocols ?? [],
          alpsProtocols: options.customTlsClient.alpsProtocols ?? [],
          ECHCandidatePayloads: options.customTlsClient.echCandidatePayloads ?? [],
          ECHCandidateCipherSuites: (options.customTlsClient.echCandidateCipherSuites ?? []).map(
            (suite) => ({
              kdfId: suite.kdfId,
              aeadId: suite.aeadId,
            })
          ),
          recordSizeLimit: options.customTlsClient.recordSizeLimit ?? 0,
          streamId: options.customTlsClient.streamId ?? 0,
          allowHttp: options.customTlsClient.allowHttp ?? false,
        }
      : undefined,
  };
};

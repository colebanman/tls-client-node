import type { NativeCookie } from "../core/cookies";

export interface NativeCustomTlsClient {
  ja3String: string;
  h2Settings: Record<string, number>;
  h2SettingsOrder: string[];
  h3Settings: Record<string, number>;
  h3SettingsOrder: string[];
  h3PseudoHeaderOrder: string[];
  h3PriorityParam: number;
  h3SendGreaseFrames: boolean;
  pseudoHeaderOrder: string[];
  connectionFlow: number;
  headerPriority?: {
    streamDep: number;
    exclusive: boolean;
    weight: number;
  };
  priorityFrames: Array<{
    streamID: number;
    priorityParam: {
      streamDep: number;
      exclusive: boolean;
      weight: number;
    };
  }>;
  certCompressionAlgos: string[];
  supportedSignatureAlgorithms: string[];
  supportedDelegatedCredentialsAlgorithms: string[];
  supportedVersions: string[];
  keyShareCurves: string[];
  alpnProtocols: string[];
  alpsProtocols: string[];
  ECHCandidatePayloads: number[];
  ECHCandidateCipherSuites: Array<{ kdfId: string; aeadId: string }>;
  recordSizeLimit: number;
  streamId: number;
  allowHttp: boolean;
}

export interface NativeRequestPayload {
  sessionId: string;
  followRedirects: boolean;
  forceHttp1: boolean;
  disableHttp3: boolean;
  withProtocolRacing: boolean;
  disableIPV6: boolean;
  disableIPV4: boolean;
  headers: Record<string, string>;
  headerOrder: string[];
  insecureSkipVerify: boolean;
  proxyUrl: string;
  requestUrl: string;
  requestMethod: string;
  requestBody?: string;
  requestCookies: NativeCookie[];
  timeoutMilliseconds: number;
  withRandomTLSExtensionOrder: boolean;
  isByteRequest: boolean;
  isByteResponse: boolean;
  withDebug: boolean;
  withoutCookieJar: boolean;
  withCustomCookieJar: boolean;
  catchPanics: boolean;
  serverNameOverwrite: string;
  tlsClientIdentifier?: string;
  customTlsClient?: NativeCustomTlsClient;
}

export interface NativeResponsePayload {
  id: string;
  status: number;
  body: string;
  headers: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  target: string;
  usedProtocol: string;
  sessionId?: string;
}

export interface NativeDestroySessionPayload {
  sessionId: string;
}

export interface NativeDestroyOutputPayload {
  id: string;
  success: boolean;
}

export interface NativeLibrary {
  request(payloadJson: string): string;
  freeMemory(id: string): void;
  destroySession(payloadJson: string): string;
  destroyAll(): string;
}

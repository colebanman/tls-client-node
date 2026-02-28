import { getNativeLibrary } from "../native/library";
import type {
  NativeDestroyOutputPayload,
  NativeRequestPayload,
  NativeResponsePayload,
} from "../native/types";
import { RequestError } from "./errors";

export interface Transport {
  request(payload: NativeRequestPayload): Promise<NativeResponsePayload>;
  destroySession(sessionId: string): Promise<boolean>;
  destroyAll(): Promise<boolean>;
}

export class NativeTransport implements Transport {
  public async request(payload: NativeRequestPayload): Promise<NativeResponsePayload> {
    const library = await getNativeLibrary();
    const raw = library.request(JSON.stringify(payload));
    const parsed = JSON.parse(raw) as NativeResponsePayload;
    try {
      if (parsed.status === 0) {
        throw new RequestError(parsed.body, payload.requestUrl);
      }
      return parsed;
    } finally {
      if (parsed.id) {
        library.freeMemory(parsed.id);
      }
    }
  }

  public async destroySession(sessionId: string): Promise<boolean> {
    const library = await getNativeLibrary();
    const raw = library.destroySession(JSON.stringify({ sessionId }));
    const parsed = JSON.parse(raw) as NativeDestroyOutputPayload;
    try {
      return parsed.success;
    } finally {
      if (parsed.id) {
        library.freeMemory(parsed.id);
      }
    }
  }

  public async destroyAll(): Promise<boolean> {
    const library = await getNativeLibrary();
    const raw = library.destroyAll();
    const parsed = JSON.parse(raw) as NativeDestroyOutputPayload;
    try {
      return parsed.success;
    } finally {
      if (parsed.id) {
        library.freeMemory(parsed.id);
      }
    }
  }
}

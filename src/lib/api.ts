// API client for the Go ceo-test-server.
// All requests are routed through the VITE_GO_BACKEND_URL env var.
// The X-Internal-Secret header is sent on every request.

const BACKEND_URL = import.meta.env.VITE_GO_BACKEND_URL as string;
const INTERNAL_SECRET = import.meta.env.VITE_INTERNAL_SECRET as string;

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status?: string;
  budget?: string;
  moveInDate?: string;
  pets?: string;
  bedroomPreference?: string;
  propertyName?: string;
  propertyId?: string;
};

export type StartResponse = {
  lead: Lead;
  teamName: string;
  teamPhone: string;
  nextTour: string;
  hasToursAhead: boolean;
};

export type SendResponse = {
  reply: string;
  systemPrompt: string;
  reasoningContent: string;
  latencyMs: number;
};

export type ChatMessage = {
  id: string;
  from: "you" | "ai" | "human";
  text: string;
  timestamp: number;
  systemPrompt?: string;
  reasoningContent?: string;
  latencyMs?: number;
};

async function request<T>(path: string, body: unknown): Promise<T> {
  if (!BACKEND_URL) {
    throw new Error("VITE_GO_BACKEND_URL is not set");
  }
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SECRET || "",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  startChat(req: { teamId: string; leadId: string; phone: string }) {
    return request<StartResponse>("/v1/test/start", req);
  },
  sendMessage(req: {
    teamId: string;
    leadId: string;
    phone: string;
    message: string;
    sendAsHuman: boolean;
  }) {
    return request<SendResponse>("/v1/test/send", req);
  },
  resetHistory(req: { teamId: string; leadId: string; phone: string }) {
    return request<{ deleted: number }>("/v1/test/reset", req);
  },
};

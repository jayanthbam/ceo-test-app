import type { ReactNode } from "react";

const TOKEN_RE =
  /(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+|\+?\d[\d\s().-]{7,}\d|\b[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}\b|\$\d{1,5}(?:[,.]\d+)*(?:\s*\/\s*mo)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d+\s*(?:bed(?:room)?s?|br|bath(?:room)?s?|ba)\b)/gi;

const URL_RE = /^https?:\/\//i;
const WWW_RE = /^www\./i;
const PHONE_RE = /^\+?\d[\d\s().-]{7,}\d$/;
const EMAIL_RE = /^[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/i;
const PRICE_RE = /^\$\d/;
const TIME_RE = /^\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;
const BED_BATH_RE = /^\d+\s*(?:bed(?:room)?s?|br|bath(?:room)?s?|ba)\b/i;

const TOUR_HINTS =
  /\b(tour|book(?:ing)?|schedule|calendly|apply|application|self[- ]?service|portal|lease)\b/i;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export type LinkKind = "url" | "tour" | "app" | "phone" | "email";

export function classifyLink(text: string): LinkKind {
  const lower = text.toLowerCase();
  if (TOUR_HINTS.test(lower) && /tour|book|schedule|calendly|self[- ]?service|portal/.test(lower)) {
    return "tour";
  }
  if (/apply|application|lease/.test(lower)) {
    return "app";
  }
  return "url";
}

export function renderMessageText(text: string): ReactNode[] {
  const parts = text.split(TOKEN_RE);
  return parts.map((part, i) => {
    if (!part) return null;

    if (URL_RE.test(part) || WWW_RE.test(part)) {
      const href = part.startsWith("www.") ? `https://${part}` : part;
      const kind = classifyLink(href);
      if (kind === "tour") {
        return (
          <a
            key={i}
            className="msg-link msg-link-cta msg-link-tour"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="msg-link-dot" />
            Book a tour · {extractDomain(href)}
            <span className="msg-link-arrow">→</span>
          </a>
        );
      }
      if (kind === "app") {
        return (
          <a
            key={i}
            className="msg-link msg-link-cta msg-link-app"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="msg-link-dot" />
            Apply · {extractDomain(href)}
            <span className="msg-link-arrow">→</span>
          </a>
        );
      }
      return (
        <a
          key={i}
          className="msg-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      );
    }

    if (PHONE_RE.test(part)) {
      return (
        <a
          key={i}
          className="msg-link msg-link-phone"
          href={`tel:${part.replace(/\s|\(|\)|-/g, "")}`}
        >
          {part}
        </a>
      );
    }

    if (EMAIL_RE.test(part)) {
      return (
        <a
          key={i}
          className="msg-link msg-link-email"
          href={`mailto:${part}`}
        >
          {part}
        </a>
      );
    }

    if (PRICE_RE.test(part)) {
      return (
        <span key={i} className="msg-hi msg-price">
          {part}
        </span>
      );
    }

    if (TIME_RE.test(part)) {
      return (
        <span key={i} className="msg-hi msg-time">
          {part}
        </span>
      );
    }

    if (BED_BATH_RE.test(part)) {
      return (
        <span key={i} className="msg-hi msg-bedbath">
          {part}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const d = new Date(ts);
  const cur = new Date(now);
  const diffMs = cur.getTime() - ts;
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(diffMs / 3_600_000);
  const day = Math.floor(diffMs / 86_400_000);

  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const sameDay =
    d.getFullYear() === cur.getFullYear() &&
    d.getMonth() === cur.getMonth() &&
    d.getDate() === cur.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (day === 1) return "Yesterday";
  if (day < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

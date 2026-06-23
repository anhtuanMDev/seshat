
import type { EquipSlot } from "../../lib/types";

export const RARITY_COLORS = {
  Common: {
    text: "Common",
    color: "#9ca3af",
    bg: "rgba(156, 163, 175, 0.05)",
    border: "rgba(156, 163, 175, 0.2)",
  },
  Rare: {
    text: "Rare",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.3)",
  },
  Epic: {
    text: "Epic",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.08)",
    border: "rgba(168, 85, 247, 0.3)",
  },
  Legendary: {
    text: "Legendary",
    color: "#eab308",
    bg: "rgba(234, 179, 8, 0.08)",
    border: "rgba(234, 179, 8, 0.3)",
  },
};

export const getSlotIcon = (slot: EquipSlot, color: string = "currentColor") => {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { opacity: 0.8 },
  };

  switch (slot) {
    case "Helmet":
      return (
        <svg {...props}>
          <path d="M12 2a9 9 0 0 0-9 9v1a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-1a9 9 0 0 0-9-9z" />
          <path d="M12 2v20" />
          <path d="M12 11c-2 0-4-1-4-3V6" />
          <path d="M12 11c2 0 4-1 4-3V6" />
        </svg>
      );
    case "Armor":
      return (
        <svg {...props}>
          <path d="M12 2s-4 1-6 2v6c0 5 6 10 6 10s6-5 6-10V4c-2-1-6-2-6-2z" />
          <path d="M6 10h12" />
          <path d="M9 14h6" />
        </svg>
      );
    case "Boots":
      return (
        <svg {...props}>
          <path d="M4 4h3v10c0 2 2 3 5 3h6v3H9c-4 0-5-2-5-5V4z" />
          <path d="M18 17h2" />
        </svg>
      );
    case "Gloves":
      return (
        <svg {...props}>
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4a2 2 0 0 0-4 0V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10a6 6 0 0 0 12 0v-4z" />
        </svg>
      );
    case "Mount":
      return (
        <svg {...props}>
          <path d="M3 10c0-3 3-5 7-5s7 2 7 5v5H3v-5z" />
          <path d="M7 15v5M13 15v5" />
          <path d="M17 10h4v2h-4v-2z" />
        </svg>
      );
    case "Weapon":
      return (
        <svg {...props}>
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l2-2" />
          <path d="M16 16l3 3-1 2-2-1-3-3z" />
        </svg>
      );
    case "Offhand":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "Accessory":
      return (
        <svg {...props}>
          <circle cx="12" cy="7" r="4" />
          <path d="M6 12l6 9 6-9" />
          <circle cx="12" cy="18" r="2" fill={color} />
        </svg>
      );
    case "Relic":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      );
    case "Other":
      return (
        <svg {...props}>
          <circle cx="12" cy="14" r="6" />
          <path d="M12 8V2m-3 0h6" />
        </svg>
      );
    default:
      return null;
  }
};

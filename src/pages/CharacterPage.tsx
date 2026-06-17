import { useSelector } from "@legendapp/state/react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { useParams } from "react-router-dom";
import { AchievementBlock } from "../components/character/AchievementBlock";
import { ConditionBlock } from "../components/character/ConditionBlock";
import { LossBlock } from "../components/character/LossBlock";
import { TraumaBlock } from "../components/character/TraumaBlock";
import { RelationshipBlock } from "../components/character/RelationshipBlock";
import type { CharacterForm } from "../components/character/types";
import { Field, Section } from "../components/ui";
import { StatusBlock } from "../components/character/StatusBlock";
import { Modal } from "../components/ui/Modal";
import {
  BadgeIcon,
  CrisisAlertIcon,
  EmojiEventsIcon,
  HeartBrokenIcon,
  MedicalInformationIcon,
  PsychologyIcon,
  RouteIcon,
  SaveIcon,
  TimelineIcon,
  PeopleIcon,
  ArticleIcon,
  ShieldIcon,
  InfoIcon,
} from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { buildExport } from "../lib/export";
import {
  useActiveBookIdx,
  useEvents,
  useCharacters,
  useChapters,
} from "../hooks/useWorldStore";
import type {
  Achievement,
  Condition,
  Loss,
  Trauma,
  Relationship,
  Equipment,
  EquipSlot,
} from "../lib/types";
import {
  S,
  mkAchieve,
  mkCond,
  mkLoss,
  mkStatusEntry,
  mkTrauma,
  mkRel,
  mkArc,
  mkEquip,
} from "../lib/utils";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { scoreFighter } from "../lib/scoreFighter";
import { resolveEquipmentAt } from "../lib/resolveEquipment";
import { updateFileOnGitHub } from "../lib/githubSync";
import { ArcBlock } from "../components/character/ArcBlock";
import { GhostAddButton } from "../components/character/GhostAddButton";
import { ArrayItemCard } from "../components/character/ArrayItemCard";
import { EquipmentBlock } from "../components/character/EquipmentBlock";

const RARITY_COLORS = {
  Common: { text: "Common", color: "#9ca3af", bg: "rgba(156, 163, 175, 0.05)", border: "rgba(156, 163, 175, 0.2)" },
  Rare: { text: "Rare", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.3)" },
  Epic: { text: "Epic", color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)", border: "rgba(168, 85, 247, 0.3)" },
  Legendary: { text: "Legendary", color: "#eab308", bg: "rgba(234, 179, 8, 0.08)", border: "rgba(234, 179, 8, 0.3)" },
};

const getSlotIcon = (slot: EquipSlot, color: string = "currentColor") => {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { opacity: 0.8 }
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

// ── Modal state type ──────────────────────────────────────────────────────
type ModalKind =
  | { type: "trauma"; idx: number | null; isNew?: boolean }
  | { type: "condition"; idx: number | null; isNew?: boolean }
  | { type: "equipment"; idx: number | null; isNew?: boolean }
  | { type: "achievement"; idx: number | null; isNew?: boolean }
  | { type: "loss"; idx: number | null; isNew?: boolean }
  | { type: "relationship"; idx: number | null; isNew?: boolean }
  | { type: "status"; idx: number | null; isNew?: boolean }
  | { type: "arc"; idx: number | null; isNew?: boolean }
  | null;

export default function CharacterPage() {
  const { id } = useParams();
  const events = useEvents();
  const chapters = useChapters() || [];
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      const numA = parseFloat(a.number) || 0;
      const numB = parseFloat(b.number) || 0;
      return numA - numB;
    });
  }, [chapters]);
  const bookIdx = useActiveBookIdx();
  const [modal, setModal] = useState<ModalKind>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTimeContext, setSelectedTimeContext] = useState<string>("base");
  const [selectedEquipContext, setSelectedEquipContext] = useState<string>("base");

  const char = useSelector(() => {
    if (bookIdx < 0) return undefined;
    return appStore.books[bookIdx].characters.get().find((c) => c.id === id);
  });
  const idx = useSelector(() => {
    if (bookIdx < 0) return -1;
    return appStore.books[bookIdx].characters
      .get()
      .findIndex((c) => c.id === id);
  });

  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<CharacterForm>({
    defaultValues: {
      name: "",
      role: "",
      archetype: "",
      gender: "",
      dob: "",
      appearance: "",
      coreWound: "",
      coreFear: "",
      coreDesire: "",
      philosophy: "",
      secrets: "",
      arcs: [],
      statusTimeline: [],
      traumas: [],
      conditions: [],
      equipment: [],
      achievements: [],
      losses: [],
      relationships: [],
    },
  });

  const [isFloating, setIsFloating] = useState(false);

  const dockedButtonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    if (dockedButtonsRef.current) {
      observer.observe(dockedButtonsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (char) {
      reset({
        name: char.name || "",
        role: char.role || "",
        archetype: char.archetype || "",
        gender: char.gender || "",
        dob: char.dob || "",
        appearance: char.appearance || "",
        coreWound: char.coreWound || "",
        coreFear: char.coreFear || "",
        coreDesire: char.coreDesire || "",
        philosophy: char.philosophy || "",
        secrets: char.secrets || "",
        arcs: char.arcs || [],
        statusTimeline: char.statusTimeline || [],
        traumas: char.traumas || [],
        conditions: char.conditions || [],
        equipment: char.equipment || [],
        achievements: char.achievements || [],
        losses: char.losses || [],
        relationships: char.relationships || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char?.id, reset]);

  const ref = useAnimateIn();

  const statusTimelineRaw = useWatch({ control, name: "statusTimeline" });
  const statusTimeline = useMemo(() => statusTimelineRaw || [], [statusTimelineRaw]);
  const activeStatusIdx = statusTimeline.findIndex((s) => s.id === selectedTimeContext);
  const isBase = selectedTimeContext === "base" || activeStatusIdx === -1;

  const isEquipBase = selectedEquipContext === "base";
  const currentEquipEventId = useMemo(() => {
    if (isEquipBase) return undefined;
    // 1. Try to find the event associated with this chapter
    const chapterEvents = (events || []).filter((e) => e.chapters?.includes(selectedEquipContext));
    if (chapterEvents.length > 0) {
      return [...chapterEvents].sort((a, b) => a.time - b.time)[0].id;
    }
    // 2. Fallback to direct event context ID if it's already an event ID
    const directEvent = (events || []).find((e) => e.id === selectedEquipContext);
    return directEvent?.id;
  }, [selectedEquipContext, events, isEquipBase]);

  const arcs = useWatch({ control, name: "arcs" }) || [];
  const traumas = useWatch({ control, name: "traumas" }) || [];
  const conditions = useWatch({ control, name: "conditions" }) || [];
  const equipmentRaw = useWatch({ control, name: "equipment" });
  const equipment = useMemo(() => equipmentRaw || [], [equipmentRaw]);
  const activeEquipment = useMemo(() => {
    return resolveEquipmentAt(
      equipment,
      events || [],
      statusTimeline,
      selectedEquipContext
    );
  }, [equipment, events, statusTimeline, selectedEquipContext]);
  const achievements = useWatch({ control, name: "achievements" }) || [];
  const losses = useWatch({ control, name: "losses" }) || [];
  const relationships = useWatch({ control, name: "relationships" }) || [];
  const baseGender = useWatch({ control, name: "gender" }) || "";
  const baseDob = useWatch({ control, name: "dob" }) || "";
  const baseAppearance = useWatch({ control, name: "appearance" }) || "";
  const allCharacters = useCharacters() || [];

  const exportText = useMemo(() => {
    if (!showExport || !char) return "";
    return buildExport({
      title: "",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: events,
      characters: [
        {
          ...char,
          ...getValues(),
        } as unknown as import("../lib/types").Character,
      ], // Merge current unsaved changes
    });
  }, [showExport, char, events, getValues]);

  if (!char) {
    return (
      <div style={styles.notFound}>
        Character not found.
      </div>
    );
  }

  const onSubmit = async () => {
    const data = getValues();
    if (bookIdx < 0 || idx < 0) return;
    const c = appStore.books[bookIdx].characters[idx];
    c.name.set(data.name);
    c.role.set(data.role);
    c.archetype.set(data.archetype);
    c.gender.set(data.gender || "");
    c.dob.set(data.dob || "");
    c.appearance.set(data.appearance || "");
    c.coreWound.set(data.coreWound);
    c.coreFear.set(data.coreFear);
    c.coreDesire.set(data.coreDesire);
    c.philosophy.set(data.philosophy);
    c.secrets.set(data.secrets);
    c.statusTimeline.set(data.statusTimeline || []);
    c.arcs.set(data.arcs || []);
    c.traumas.set(data.traumas || []);
    c.conditions.set(data.conditions);
    c.equipment.set(data.equipment || []);
    c.achievements.set(data.achievements);
    c.losses.set(data.losses);
    c.relationships.set(data.relationships);

    // API delta sync
    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    const bookId = appStore.activeBookId.get();
    if (token && id && bookId) {
      try {
        setIsSaving(true);
        const payload = {
          id: id,
          color: char.color,
          name: data.name,
          role: data.role,
          archetype: data.archetype,
          gender: data.gender,
          dob: data.dob,
          appearance: data.appearance,
          coreWound: data.coreWound,
          coreFear: data.coreFear,
          coreDesire: data.coreDesire,
          philosophy: data.philosophy,
          secrets: data.secrets,
          arcs: data.arcs,
          statusTimeline: data.statusTimeline,
          traumas: data.traumas,
          conditions: data.conditions,
          equipment: data.equipment,
          achievements: data.achievements,
          losses: data.losses,
          relationships: data.relationships,
        };
        await updateFileOnGitHub(
          token,
          bookId,
          `characters/char_${id}.json`,
          JSON.stringify(payload, null, 2),
        );
        showToast("Character synced to cloud", "success");
        reset(data);
      } catch {
        showToast("Failed to sync character to cloud", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // ── Array helpers ─────────────────────────────────────────────────────
  const openAddEquipmentForSlot = (slotName: EquipSlot) => {
    const current = getValues("equipment") || [];
    const newItem: Equipment = {
      ...mkEquip(),
      slot: slotName,
    };
    setValue("equipment", [...current, newItem]);
    setModal({ type: "equipment", idx: current.length, isNew: true });
  };

  const autoEquip = () => {
    const current = [...(getValues("equipment") || [])];
    let changed = false;
    const slots = ["Helmet", "Armor", "Boots", "Gloves", "Mount", "Weapon", "Offhand", "Accessory", "Relic", "Other"] as const;
    slots.forEach((slotName) => {
      const isEquipped = current.some((eq) => eq.slot === slotName && eq.accessState === "Equipped");
      if (!isEquipped) {
        const stashItemIdx = current.findIndex((eq) => eq.slot === slotName && eq.accessState !== "Equipped");
        if (stashItemIdx >= 0) {
          current[stashItemIdx] = {
            ...current[stashItemIdx],
            accessState: "Equipped",
          };
          changed = true;
        }
      }
    });
    if (changed) {
      setValue("equipment", current, { shouldDirty: true });
    }
  };

  const unequipAll = () => {
    const current = (getValues("equipment") || []).map((eq) => {
      if (eq.accessState === "Equipped") {
        return { ...eq, accessState: "Stored" as const };
      }
      return eq;
    });
    setValue("equipment", current, { shouldDirty: true });
  };

  const handleCopyEquipmentStateFrom = (sourceEventId: string) => {
    const currentEventId = selectedEquipContext !== "base" ? selectedEquipContext : undefined;
    if (!currentEventId) return;

    // Get the resolved equipment at the source context
    const sourceEquip = resolveEquipmentAt(
      equipment,
      events || [],
      statusTimeline,
      sourceStatusId,
    );

    // Update the equipment list
    const updated = equipment.map((item) => {
      // Find the state of this item in the source chapter
      const sourceItem = sourceEquip.find((s) => s.id === item.id);
      if (!sourceItem) return item; // Item didn't exist or wasn't active

      // Add a history entry for the current event
      const history = [...(item.history || [])].filter((h) => h.eventId !== currentEventId);
      history.push({
        eventId: currentEventId,
        accessState: sourceItem.accessState,
      });

      return {
        ...item,
        history,
      };
    });

    setValue("equipment", updated, { shouldDirty: true });
    showToast("Equipment state copied successfully!", "success");
  };

  const toggleItemAccessState = (itemIndex: number) => {
    const current = [...(getValues("equipment") || [])];
    const item = current[itemIndex];
    if (!item) return;

    let targetState: "Equipped" | "Stored";

    if (isEquipBase) {
      targetState = item.accessState === "Equipped" ? "Stored" : "Equipped";
      current[itemIndex] = {
        ...item,
        accessState: targetState,
      };
    } else {
      const currentEventId = selectedEquipContext !== "base" ? selectedEquipContext : undefined;
      if (!currentEventId) return;

      const activeEquip = resolveEquipmentAt(
        equipment,
        events || [],
        statusTimeline,
        selectedEquipContext,
      );
      const activeItem = activeEquip.find((eq) => eq.id === item.id);
      const currentResolvedState = activeItem?.accessState || item.accessState;

      targetState = currentResolvedState === "Equipped" ? "Stored" : "Equipped";

      const history = [...(item.history || [])].filter((h) => h.eventId !== currentEventId);
      history.push({
        eventId: currentEventId,
        accessState: targetState,
      });

      current[itemIndex] = {
        ...item,
        history,
      };
    }

    setValue("equipment", current, { shouldDirty: true });
    showToast(
      `Item moved to ${targetState === "Equipped" ? "Equipped Slots" : "Stash / Inventory"}!`,
      "success"
    );
  };

  const viewStats = () => {
    if (!char) return;
    const res = scoreFighter(char, events);
    
    let base = 0;
    let equipmentBonus = 0;
    let lossPenalty = 0;
    
    res.notes.forEach((n) => {
      if (n.label.includes("Equipped items")) {
        equipmentBonus += n.pts;
      } else if (n.pts < 0) {
        lossPenalty += Math.abs(n.pts);
      } else {
        base += n.pts;
      }
    });

    alert(
      `Combat Status Breakdown for ${char.name}:\n\n` +
      `Combat Rating: ${res.score.toFixed(1)}\n` +
      `• Base Potential: ${base.toFixed(1)}\n` +
      `• Equipment Modifier: +${equipmentBonus.toFixed(1)}\n` +
      `• Trauma / Defeat Penalty: -${lossPenalty.toFixed(1)}`
    );
  };

  const openAdd = (
    type:
      | "trauma"
      | "condition"
      | "equipment"
      | "achievement"
      | "loss"
      | "relationship"
      | "status"
      | "arc",
  ) => {
    const fieldMap = {
      trauma: "traumas" as const,
      condition: "conditions" as const,
      equipment: "equipment" as const,
      achievement: "achievements" as const,
      loss: "losses" as const,
      relationship: "relationships" as const,
      status: "statusTimeline" as const,
      arc: "arcs" as const,
    };
    const mkMap = {
      trauma: mkTrauma,
      condition: mkCond,
      equipment: mkEquip,
      achievement: mkAchieve,
      loss: mkLoss,
      relationship: mkRel,
      status: mkStatusEntry,
      arc: mkArc,
    };
    const current = getValues(fieldMap[type]);
    setValue(fieldMap[type], [...current, mkMap[type]()] as never);
    setModal({ type, idx: current.length, isNew: true });
  };

  const openEdit = (
    type:
      | "trauma"
      | "condition"
      | "equipment"
      | "achievement"
      | "loss"
      | "relationship"
      | "status"
      | "arc",
    idx: number,
  ) => {
    setModal({ type, idx });
  };

  const delItem = (
    type:
      | "trauma"
      | "condition"
      | "equipment"
      | "achievement"
      | "loss"
      | "relationship"
      | "status"
      | "arc",
    itemIdx: number,
  ) => {
    const fieldMap = {
      trauma: "traumas" as const,
      condition: "conditions" as const,
      equipment: "equipment" as const,
      achievement: "achievements" as const,
      loss: "losses" as const,
      relationship: "relationships" as const,
      status: "statusTimeline" as const,
      arc: "arcs" as const,
    };
    const current = getValues(fieldMap[type]);
    setValue(
      fieldMap[type],
      current.filter((_: unknown, i: number) => i !== itemIdx) as never,
    );
    setModal(null);
  };

  const handleCancelModal = () => {
    if (modal?.isNew && modal.idx !== null) {
      delItem(modal.type, modal.idx);
    } else {
      setModal(null);
    }
  };

  const handleSaveModal = () => {
    setModal(null);
    onSubmit();
  };

  const colorDotStyle = {
    ...styles.colorDot,
    background: char.color,
  };

  const activeSaveStyle = {
    ...styles.saveBtnActive,
    cursor: isSaving ? "default" : "pointer",
    opacity: isSaving ? 0.7 : 1,
  };

  const genderName = (isBase ? "gender" : `statusTimeline.${activeStatusIdx}.gender`) as Path<CharacterForm>;
  const dobName = (isBase ? "dob" : `statusTimeline.${activeStatusIdx}.dob`) as Path<CharacterForm>;
  const appearanceName = (isBase ? "appearance" : `statusTimeline.${activeStatusIdx}.appearance`) as Path<CharacterForm>;

  const placeholderGender = isBase ? "Female, Non-binary, he/him…" : `Inherit: "${baseGender || 'none'}"`;
  const placeholderDob = isBase ? "Born 201 ERA, age 24…" : `Inherit: "${baseDob || 'none'}"`;
  const placeholderAppearance = isBase ? "Tall with scarred hands, wearing silver chainmail…" : `Inherit: "${baseAppearance || 'none'}"`;

  return (
    <>
      <div
        ref={ref}
        className="seshat-page-container"
        data-testid="character-page-container"
      >
        {/* ── Header ── */}
        <div
          className="seshat-flex-between"
          style={styles.header}
        >
          <div style={styles.nameContainer}>
            <span style={colorDotStyle} />
            <input
              {...register("name")}
              data-testid="character-name-input"
              style={styles.nameInput}
            />
          </div>
          <div
            ref={dockedButtonsRef}
            style={styles.buttonsContainer}
          >
            <button
              onClick={() => setShowExport(true)}
              data-testid="character-export-btn"
              style={styles.exportBtn}
            >
              <ArticleIcon sx={{ fontSize: 12 }} />
              export
            </button>
            <button
              onClick={onSubmit}
              disabled={!isDirty || isSaving}
              data-testid="character-save-btn"
              style={isDirty ? activeSaveStyle : styles.saveBtnInactive}
            >
              <SaveIcon sx={{ fontSize: 14 }} />
              {isSaving ? "saving..." : "save"}
            </button>
          </div>
        </div>

        {/* ── Biography & Appearance ── */}
        <div data-testid="biography-section">
          <Section
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{ display: "flex", alignItems: "center" }}>
                  <InfoIcon sx={{ fontSize: 12, marginRight: 4 }} />
                  Biography & Appearance
                </span>
                <select
                  value={isBase ? "base" : selectedTimeContext}
                  onChange={(e) => setSelectedTimeContext(e.target.value)}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    outline: "none",
                    cursor: "pointer",
                    marginLeft: 16,
                    fontWeight: "normal",
                  }}
                >
                  <option value="base">Base (Default)</option>
                  {statusTimeline.map((s) => {
                    const ev = events.find((e) => e.id === s.eventId);
                    const label = ev
                      ? `T${ev.time} — ${ev.title}`
                      : s.startDate
                        ? `Period: ${s.startDate.replace("T", " ")}`
                        : `Timeline Entry (${s.id.slice(0, 4)})`;
                    return (
                      <option key={s.id} value={s.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            }
          >
            <p style={styles.sectionSub}>
              {isBase
                ? "Physical traits, gender details, date of birth, and visual features."
                : (() => {
                    const s = statusTimeline[activeStatusIdx];
                    const ev = events.find((e) => e.id === s?.eventId);
                    return `Editing overrides for timeline entry: ${
                      ev ? `T${ev.time} — ${ev.title}` : s?.startDate ? s.startDate.replace("T", " ") : `Entry (${s?.id.slice(0, 4)})`
                    }`;
                  })()}
            </p>
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Gender / pronouns"
                name={genderName}
                control={control}
                placeholder={placeholderGender}
              />
              <Field
                label="Date of birth / age"
                name={dobName}
                control={control}
                placeholder={placeholderDob}
              />
            </div>
            <Field
              label="Appearance / physical details"
              name={appearanceName}
              control={control}
              multi
              rows={3}
              placeholder={placeholderAppearance}
            />
          </Section>
        </div>

        {/* ── Status Timeline ── */}
        <Section
          title={
            <>
              <TimelineIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Status Timeline ({statusTimeline.length})
            </>
          }
          action={<GhostAddButton onClick={() => openAdd("status")} />}
        >
          <p style={styles.sectionSub}>
            Track how their physical state, emotions, and roles shift over time
            and events.
          </p>

          <div style={styles.listContainer}>
            {statusTimeline
              .map((s, i) => ({ s, i }))
              .sort((a, b) => {
                const evA = events.find((e) => e.id === a.s.eventId);
                const evB = events.find((e) => e.id === b.s.eventId);
                return (
                  (evA?.time ?? 0) - (evB?.time ?? 0) ||
                  a.s.id.localeCompare(b.s.id)
                );
              })
              .map(({ s, i }) => {
                const ev = events.find((e) => e.id === s.eventId);
                const dateTag = [
                  s.startDate && s.startDate.replace("T", " "),
                  s.endDate && `→ ${s.endDate.replace("T", " ")}`,
                ]
                  .filter(Boolean)
                  .join(" ");
                const label = ev
                  ? `T${ev.time} — ${ev.title}`
                  : "Unknown Event";

                const title = `${label}${dateTag ? ` (${dateTag})` : ""}`;
                const tags = [
                  s.power && `Power: ${s.power}`,
                  s.arcStage && `Arc: ${s.arcStage}`,
                  s.role && `Role: ${s.role}`,
                  s.archetype && `Archetype: ${s.archetype}`,
                  s.gender && `Gender: ${s.gender}`,
                  s.dob && `DOB: ${s.dob}`,
                  s.appearance && `Looks: ${s.appearance.length > 30 ? s.appearance.slice(0, 27) + "..." : s.appearance}`,
                  s.emotionalState && `Emotion: ${s.emotionalState}`,
                  s.physicalState && `Physical: ${s.physicalState}`,
                ].filter(Boolean) as string[];

                return (
                  <ArrayItemCard
                    key={s.id}
                    color={char.color}
                    title={title}
                    body={s.note}
                    tags={tags}
                    onEdit={() => openEdit("status", i)}
                    onDelete={() => delItem("status", i)}
                  />
                );
              })}
          </div>
          {!statusTimeline.length && (
            <p style={styles.sectionSubItalic}>
              No status entries recorded.
            </p>
          )}
        </Section>

        {/* ── Primary Identity ── */}
        <div data-testid="primary-identity-section">
          <Section
            title={
              <>
                <BadgeIcon sx={{ fontSize: 12, marginRight: 4 }} />
                Primary Identity
              </>
            }
          >
            <p style={styles.sectionSub}>
              Core defining roles. These can be overridden for specific events
              in the timeline above as the character evolves.
            </p>
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Primary role in story"
                name="role"
                control={control}
                placeholder="Protagonist, mentor…"
              />
              <Field
                label="Primary archetype"
                name="archetype"
                control={control}
                placeholder="The trickster…"
              />
            </div>
          </Section>
        </div>



        {/* ── Psychological core ── */}
        <div data-testid="psychological-core-section">
          <Section
            title={
              <>
                <PsychologyIcon sx={{ fontSize: 12, marginRight: 4 }} />
                Psychological core
              </>
            }
          >
            <Field
              label="Core wound"
              name="coreWound"
              control={control}
              multi
              rows={2}
              placeholder="The formative trauma that shaped everything."
            />
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Core fear"
                name="coreFear"
                control={control}
                placeholder="What they most dread."
              />
              <Field
                label="Core desire"
                name="coreDesire"
                control={control}
                placeholder="What they most want."
              />
            </div>
            <Field
              label="Philosophy / belief system"
              name="philosophy"
              control={control}
              multi
              rows={2}
              placeholder="How they see the world."
            />
            <Field
              label="Secrets (always carried)"
              name="secrets"
              control={control}
              multi
              rows={2}
              placeholder="What they hide. How it shapes every word they say."
            />

            <hr style={S.rule} />

            {/* Traumas */}
            <div
              className="seshat-flex-between"
              style={styles.sectionTitleRow}
            >
              <p style={styles.titleTextWithIcon}>
                <CrisisAlertIcon sx={{ fontSize: 12 }} />
                Traumas ({traumas.length})
              </p>
              <GhostAddButton onClick={() => openAdd("trauma")} />
            </div>

            <div style={styles.listContainer}>
              {traumas.map((t: Trauma, i: number) => (
                <ArrayItemCard
                  key={t.id}
                  color={char.color}
                  title={t.title || "Untitled trauma"}
                  subtitle={t.when ? `@ ${t.when}` : undefined}
                  body={t.description}
                  tags={
                    [
                      t.trigger && `trigger: ${t.trigger}`,
                      t.manifestation && `manifests: ${t.manifestation}`,
                    ].filter(Boolean) as string[]
                  }
                  onEdit={() => openEdit("trauma", i)}
                  onDelete={() => delItem("trauma", i)}
                />
              ))}
            </div>
            {!traumas.length && (
              <p style={styles.sectionSubItalic}>
                No traumas recorded.
              </p>
            )}
          </Section>
        </div>

        {/* ── Character arc ── */}
        <Section
          title={
            <>
              <RouteIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Character arc
            </>
          }
          action={
            <GhostAddButton
              onClick={(e) => {
                e.stopPropagation();
                openAdd("arc");
              }}
            />
          }
        >
          <p style={styles.sectionSub}>
            Where they begin and where they end. The transformation the story
            puts them through.
          </p>
          <div style={S.grid3} className="seshat-grid3">
            {arcs.map((a, i) => {
              const ev1 = events.find((e) => e.id === a.arcFromEventId);
              const ev2 = events.find((e) => e.id === a.arcToEventId);
              const fromStr = ev1 ? `T${ev1.time}` : a.arcFromTime;
              const toStr = ev2 ? `T${ev2.time}` : a.arcToTime;
              const label = [
                fromStr && `From ${fromStr}`,
                toStr && `To ${toStr}`,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <ArrayItemCard
                  key={a.id}
                  color={char.color}
                  title={a.arcType || `Arc ${i + 1}`}
                  subtitle={label || undefined}
                  body={
                    a.arcStart
                      ? `${a.arcStart} → ${a.arcEnd || "?"}`
                      : undefined
                  }
                  onEdit={() => openEdit("arc", i)}
                  onDelete={() => {
                    delItem("arc", i);
                  }}
                />
              );
            })}
          </div>
          {!arcs.length && (
            <p style={styles.sectionSubItalic}>No arcs recorded.</p>
          )}
        </Section>

        {/* ── Conditions ── */}
        <Section
          title={
            <>
              <MedicalInformationIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Conditions ({conditions.length})
            </>
          }
          action={<GhostAddButton onClick={() => openAdd("condition")} />}
        >
          <p style={styles.sectionSub}>
            Current physical, mental, social, or spiritual states.
          </p>
          <div style={styles.listContainer}>
            {conditions.map((cd: Condition, i: number) => (
              <ArrayItemCard
                key={cd.id}
                color={cd.isActive ? "var(--color-orange)" : "var(--border)"}
                title={cd.name || "Untitled condition"}
                subtitle={`[${cd.type}]${!cd.isActive ? " · resolved" : " · active"}`}
                body={cd.description}
                tags={
                  [cd.effects && `effects: ${cd.effects}`].filter(
                    Boolean,
                  ) as string[]
                }
                onEdit={() => openEdit("condition", i)}
                onDelete={() => delItem("condition", i)}
              />
            ))}
          </div>
          {!conditions.length && <p style={S.dim}>No conditions yet.</p>}
        </Section>

        {/* ── Equipment ── */}
        <Section
          title={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span style={{ display: "flex", alignItems: "center" }}>
                <ShieldIcon sx={{ fontSize: 12, marginRight: 4 }} />
                Equipment ({activeEquipment.length})
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>TIMELINE VIEW:</span>
                <select
                  value={selectedEquipContext}
                  onChange={(e) => setSelectedEquipContext(e.target.value)}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    outline: "none",
                    cursor: "pointer",
                    fontWeight: "normal",
                  }}
                >
                  <option value="base">Base (Default State)</option>
                  {sortedChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.number} — {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        >
          <p style={styles.sectionSubMb20}>
            Manage the gear, relics, and items equipped by your character.
          </p>

          {char && (
            <div>
              <div className="seshat-gear-sheet-layout">
                {/* Left Column slots */}
                <div style={styles.gearColumn}>
                  {(["Helmet", "Armor", "Gloves", "Boots", "Mount"] as const).map((slotName) => {
                    const eq = activeEquipment.find(
                      (item) => item.slot === slotName && item.accessState === "Equipped"
                    );
                    if (eq) {
                      const itemIndex = equipment.findIndex((item) => item.id === eq.id);
                      const itemRarity = eq.rarity || "Common";
                      const rar = RARITY_COLORS[itemRarity];
                      return (
                        <div
                          key={slotName}
                          onClick={() => openEdit("equipment", itemIndex)}
                          className="seshat-filled-slot"
                          style={{
                            ...styles.filledSlotCard,
                            borderColor: rar.border,
                            background: rar.bg,
                            borderLeft: `3px solid ${rar.color}`,
                          }}
                        >
                          <div style={styles.slotIconBox}>
                            {getSlotIcon(slotName, rar.color)}
                          </div>
                          <div style={styles.slotDetails}>
                            <div style={styles.slotLabel}>{slotName}</div>
                            <div style={styles.slotItemName}>{eq.name}</div>
                            <div style={styles.slotRarityRow}>
                              <span style={{ ...styles.rarityDot, background: rar.color }} />
                              <span style={{ ...styles.rarityText, color: rar.color }}>{rar.text}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemAccessState(itemIndex);
                            }}
                            style={styles.slotActionBtn}
                            title="Move to Stash"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--color-primary)";
                              e.currentTarget.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.opacity = "0.7";
                            }}
                          >
                            📥
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              delItem("equipment", itemIndex);
                            }}
                            style={styles.slotDeleteBtn}
                            title="Delete item completely"
                          >
                            ×
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={slotName}
                        onClick={() => openAddEquipmentForSlot(slotName)}
                        className="seshat-empty-slot"
                        style={styles.emptySlotCard}
                      >
                        <div style={styles.emptySlotIconBox}>
                          {getSlotIcon(slotName, "var(--text-muted)")}
                        </div>
                        <div style={styles.emptySlotDetails}>
                          <div style={styles.emptySlotLabel}>{slotName}</div>
                          <div style={styles.emptySlotAction}>+ equip</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Column: Character details and combat score */}
                <div className="seshat-gear-center-column" style={styles.gearCenterColumn}>
                  <div
                    style={{
                      ...styles.gearAvatarCircle,
                      borderColor: char.color || "var(--border)",
                      boxShadow: `0 0 24px ${char.color || "var(--border)"}33`,
                    }}
                  >
                    <span style={styles.gearAvatarInitial}>
                      {char.name ? char.name.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                  <div style={styles.gearCharName}>{char.name}</div>
                  <div style={styles.gearCharRole}>
                    {char.role || "No Role"} {char.archetype && `· ${char.archetype}`}
                  </div>
                  <div style={styles.gearPowerBadge}>
                    <span style={styles.gearPowerLabel}>combat score</span>
                    <span style={styles.gearPowerValue}>
                      {scoreFighter(char, events, currentEquipEventId).score.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Right Column slots */}
                <div style={styles.gearColumn}>
                  {(["Weapon", "Offhand", "Accessory", "Relic", "Other"] as const).map((slotName) => {
                    const eq = activeEquipment.find(
                      (item) => item.slot === slotName && item.accessState === "Equipped"
                    );
                    if (eq) {
                      const itemIndex = equipment.findIndex((item) => item.id === eq.id);
                      const itemRarity = eq.rarity || "Common";
                      const rar = RARITY_COLORS[itemRarity];
                      return (
                        <div
                          key={slotName}
                          onClick={() => openEdit("equipment", itemIndex)}
                          className="seshat-filled-slot"
                          style={{
                            ...styles.filledSlotCard,
                            borderColor: rar.border,
                            background: rar.bg,
                            borderLeft: `3px solid ${rar.color}`,
                          }}
                        >
                          <div style={styles.slotIconBox}>
                            {getSlotIcon(slotName, rar.color)}
                          </div>
                          <div style={styles.slotDetails}>
                            <div style={styles.slotLabel}>{slotName}</div>
                            <div style={styles.slotItemName}>{eq.name}</div>
                            <div style={styles.slotRarityRow}>
                              <span style={{ ...styles.rarityDot, background: rar.color }} />
                              <span style={{ ...styles.rarityText, color: rar.color }}>{rar.text}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemAccessState(itemIndex);
                            }}
                            style={styles.slotActionBtn}
                            title="Move to Stash"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--color-primary)";
                              e.currentTarget.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.opacity = "0.7";
                            }}
                          >
                            📥
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              delItem("equipment", itemIndex);
                            }}
                            style={styles.slotDeleteBtn}
                            title="Delete item completely"
                          >
                            ×
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={slotName}
                        onClick={() => openAddEquipmentForSlot(slotName)}
                        className="seshat-empty-slot"
                        style={styles.emptySlotCard}
                      >
                        <div style={styles.emptySlotIconBox}>
                          {getSlotIcon(slotName, "var(--text-muted)")}
                        </div>
                        <div style={styles.emptySlotDetails}>
                          <div style={styles.emptySlotLabel}>{slotName}</div>
                          <div style={styles.emptySlotAction}>+ equip</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Row */}
              <div style={styles.quickActionsContainer}>
                <button onClick={autoEquip} style={styles.quickActionBtn}>
                  ⚡ Auto Equip
                </button>
                <button onClick={unequipAll} style={styles.quickActionBtn}>
                  🚫 Unequip All
                </button>
                <button onClick={viewStats} style={styles.quickActionBtn}>
                  📊 View Stats
                </button>
                {!isBase && (
                  <div style={{ display: "inline-flex", alignItems: "center" }}>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleCopyEquipmentStateFrom(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        padding: "5px 12px",
                        fontSize: "11px",
                        cursor: "pointer",
                        height: "28px",
                        outline: "none",
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>📋 Clone Gear State...</option>
                      <option value="base">Default / Base State</option>
                      {sortedChapters
                        .filter((ch) => ch.id !== selectedEquipContext)
                        .map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.number} - {ch.title}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Rarity Guide Legend */}
              <div style={styles.rarityGuideRow}>
                <span style={styles.rarityGuideLabel}>RARITY GUIDE:</span>
                {(["Common", "Rare", "Epic", "Legendary"] as const).map((rarKey) => {
                  const rar = RARITY_COLORS[rarKey];
                  return (
                    <div key={rarKey} style={styles.rarityGuideItem}>
                      <span style={{ ...styles.rarityDot, background: rar.color }} />
                      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{rar.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stash / Inventory */}
          <div style={styles.stashSection}>
            <div style={styles.stashHeader}>
              <span style={styles.stashTitle}>Stash / Inventory</span>
              <GhostAddButton onClick={() => openAdd("equipment")} />
            </div>
            <div style={styles.stashGrid}>
              {activeEquipment
                .filter((eq: Equipment) => eq.accessState !== "Equipped")
                .map((eq: Equipment) => {
                  const itemIndex = equipment.findIndex((item) => item.id === eq.id);
                  const isStored = eq.accessState === "Stored";
                  const itemRarity = eq.rarity || "Common";
                  const rar = RARITY_COLORS[itemRarity];
                  return (
                    <div
                      key={eq.id}
                      onClick={() => openEdit("equipment", itemIndex)}
                      className="seshat-filled-slot"
                      style={{
                        ...styles.filledSlotCard,
                        borderColor: rar.border,
                        background: rar.bg,
                        borderLeft: `3px solid ${rar.color}`,
                      }}
                    >
                      <div style={styles.slotIconBox}>
                        {getSlotIcon(eq.slot, rar.color)}
                      </div>
                      <div style={styles.slotDetails}>
                        <div style={styles.slotLabel}>{eq.slot}</div>
                        <div style={styles.slotItemName}>{eq.name}</div>
                        <div style={styles.slotRarityRow}>
                          <span style={{ ...styles.rarityDot, background: rar.color }} />
                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
                            {isStored ? "Stored" : "No Access"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemAccessState(itemIndex);
                        }}
                        style={styles.slotActionBtn}
                        title="Equip Item"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--color-primary)";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.opacity = "0.7";
                        }}
                      >
                        📤
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          delItem("equipment", itemIndex);
                        }}
                        style={styles.slotDeleteBtn}
                        title="Delete item completely"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              {!activeEquipment.filter((eq) => eq.accessState !== "Equipped").length && (
                <p style={{ ...S.dim, gridColumn: "1 / -1", fontStyle: "italic", margin: 0 }}>
                  No items in stash.
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Achievements & Losses ── */}
        <Section
          title={
            <>
              <EmojiEventsIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Achievements & losses ({achievements.length + losses.length})
            </>
          }
        >
          <p style={styles.sectionSubMb5}>
            What they've gained and lost over the course of the story.
          </p>

          <div
            className="seshat-flex-between"
            style={styles.sectionTitleRowMb3}
          >
            <p style={styles.titleTextWithIcon}>
              <EmojiEventsIcon sx={{ fontSize: 12 }} />
              Achievements ({achievements.length})
            </p>
            <GhostAddButton onClick={() => openAdd("achievement")} />
          </div>
          <div style={styles.listContainerMb6}>
            {achievements.map((a: Achievement, i: number) => (
              <ArrayItemCard
                key={a.id}
                color="var(--color-green)"
                title={a.title || "Untitled achievement"}
                subtitle={a.atTime ? `T${a.atTime}` : undefined}
                body={a.description}
                tags={
                  [a.gained && `gained: ${a.gained}`].filter(
                    Boolean,
                  ) as string[]
                }
                onEdit={() => openEdit("achievement", i)}
                onDelete={() => delItem("achievement", i)}
              />
            ))}
          </div>
          {!achievements.length && (
            <p style={styles.sectionSubMb20}>No achievements yet.</p>
          )}

          <hr style={S.rule} />

          <div
            className="seshat-flex-between"
            style={styles.sectionTitleRowMb3}
          >
            <p style={styles.titleTextWithIcon}>
              <HeartBrokenIcon sx={{ fontSize: 12 }} />
              Losses ({losses.length})
            </p>
            <GhostAddButton onClick={() => openAdd("loss")} />
          </div>
          <div style={styles.listContainer}>
            {losses.map((ls: Loss, i: number) => (
              <ArrayItemCard
                key={ls.id}
                color="var(--color-red)"
                title={ls.title || "Untitled loss"}
                subtitle={ls.atTime ? `T${ls.atTime}` : undefined}
                body={ls.description}
                onEdit={() => openEdit("loss", i)}
                onDelete={() => delItem("loss", i)}
              />
            ))}
          </div>
          {!losses.length && <p style={S.dim}>No losses yet.</p>}
        </Section>

        {/* ── Relationships ── */}
        <Section
          title={
            <>
              <PeopleIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Relationships ({relationships.length})
            </>
          }
          action={<GhostAddButton onClick={() => openAdd("relationship")} />}
        >
          <p style={styles.sectionSub}>
            How this character relates to others over time.
          </p>
          <div style={styles.listContainer}>
            {relationships.map((rel: Relationship, i: number) => {
              const otherChar = allCharacters.find((c) => c.id === rel.withId);
              const title = otherChar ? otherChar.name : "Unknown Character";
              return (
                <ArrayItemCard
                  key={rel.id}
                  color="var(--color-primary)"
                  title={title}
                  subtitle={rel.feel ? `[${rel.feel}]` : undefined}
                  body={
                    rel.timeline?.length > 0
                      ? `Timeline: ${rel.timeline.map((t) => `T${t.time} (${t.dynamic})`).join(" → ")}`
                      : undefined
                  }
                  onEdit={() => openEdit("relationship", i)}
                  onDelete={() => delItem("relationship", i)}
                />
              );
            })}
          </div>
          {!relationships.length && (
            <p style={S.dim}>No relationships defined.</p>
          )}
        </Section>

        {/* ── Modals ── */}
        {modal?.type === "trauma" && modal.idx !== null && (
          <Modal
            title="Trauma"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <TraumaBlock
              control={control}
              index={modal.idx}
              color={char.color}
              onDelete={() => delItem("trauma", modal.idx!)}
            />
          </Modal>
        )}

        {modal?.type === "condition" && modal.idx !== null && (
          <Modal
            title="Condition"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <ConditionBlock
              control={control}
              index={modal.idx}
              color="var(--color-orange)"
              onDelete={() => delItem("condition", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "equipment" && modal.idx !== null && (
          <Modal
            title="Equipment"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <EquipmentBlock
              control={control}
              index={modal.idx}
              color="var(--color-primary)"
              onDelete={() => delItem("equipment", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "achievement" && modal.idx !== null && (
          <Modal
            title="Achievement"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <AchievementBlock
              control={control}
              index={modal.idx}
              onDelete={() => delItem("achievement", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "loss" && modal.idx !== null && (
          <Modal
            title="Loss"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <LossBlock
              control={control}
              index={modal.idx}
              onDelete={() => delItem("loss", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "relationship" && modal.idx !== null && (
          <Modal
            title="Relationship"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <RelationshipBlock
              control={control}
              index={modal.idx}
              onDelete={() => delItem("relationship", modal.idx!)}
              characters={allCharacters}
              currentCharacterId={char.id}
            />
          </Modal>
        )}

        {modal?.type === "status" && modal.idx !== null && (
          <Modal
            title="Status Entry"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <StatusBlock
              control={control}
              index={modal.idx}
              color={char.color}
              onDelete={() => delItem("status", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {modal?.type === "arc" && modal.idx !== null && (
          <Modal
            title="Character Arc"
            onClose={handleCancelModal}
            footer={
              <button
                onClick={handleSaveModal}
                style={styles.doneBtn}
              >
                <SaveIcon sx={{ fontSize: 12 }} />
                done
              </button>
            }
          >
            <ArcBlock
              control={control}
              index={modal.idx}
              color={char.color}
              onDelete={() => delItem("arc", modal.idx!)}
              events={events}
            />
          </Modal>
        )}

        {/* Export Modal */}
        {showExport && (
          <Modal
            title={`Export ${char.name || "Character"}`}
            onClose={() => setShowExport(false)}
            footer={
              <div style={styles.exportModalFooter}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    ...S.ghost,
                    color: copied
                      ? "var(--color-green)"
                      : "var(--color-primary)",
                  }}
                >
                  {copied ? "Copied!" : "Copy text"}
                </button>
                <button onClick={() => setShowExport(false)} style={S.ghost}>
                  Close
                </button>
              </div>
            }
          >
            <div style={styles.exportModalBody}>
              <p style={styles.sectionSubMb16}>
                Paste into your AI's system prompt. Includes full psychological
                profile, history, state, and relationships for this character.
                Includes any unsaved changes you just made!
              </p>
              <textarea
                readOnly
                value={exportText}
                style={styles.exportTextarea}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </Modal>
        )}
      </div>

      {isFloating && (
        <div className="seshat-chapter-toolbar floating">
          <button
            onClick={() => setShowExport(true)}
            data-testid="character-export-btn-floating"
            style={styles.exportBtn}
          >
            <ArticleIcon sx={{ fontSize: 12 }} />
            export
          </button>
          <button
            disabled={!isDirty || isSaving}
            onClick={onSubmit}
            title="Save changes"
            style={isDirty ? activeSaveStyle : styles.saveBtnInactive}
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  notFound: {
    padding: "40px",
    color: "var(--text-secondary)",
  },
  header: {
    marginBottom: "var(--space-6)",
    gap: "var(--space-4)",
  },
  nameContainer: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  nameInput: {
    ...S.input,
    fontSize: "var(--text-3xl)",
    fontFamily: "var(--font-serif)",
    border: "none",
    padding: 0,
    flex: 1,
    color: "var(--text-primary)",
    letterSpacing: 0.3,
  },
  buttonsContainer: {
    display: "flex",
    gap: "var(--space-3)",
  },
  exportBtn: {
    ...S.ghost,
    fontSize: "var(--text-xs)",
    letterSpacing: 1,
    color: "var(--color-primary)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "6px 14px",
    borderRadius: 4,
    border: "1px solid transparent",
  },
  saveBtnActive: {
    background: "var(--color-green)",
    color: "var(--bg-app)",
    border: "1px solid var(--color-green)",
    borderRadius: 4,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  saveBtnInactive: {
    ...S.ghost,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    color: "var(--color-green)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 4,
    border: "1px solid transparent",
    opacity: 0.5,
    cursor: "default",
  },
  sectionSub: {
    ...S.dim,
    marginBottom: "var(--space-3)",
  },
  sectionSubMb5: {
    ...S.dim,
    marginBottom: "var(--space-5)",
  },
  sectionSubMb16: {
    ...S.dim,
    marginBottom: 16,
  },
  sectionSubMb20: {
    ...S.dim,
    marginBottom: 20,
  },
  sectionSubItalic: {
    ...S.dim,
    fontStyle: "italic",
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  listContainerMb6: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
    marginBottom: "var(--space-6)",
  },
  sectionTitleRow: {
    marginBottom: "var(--space-4)",
  },
  sectionTitleRowMb3: {
    marginBottom: "var(--space-3)",
  },
  titleTextWithIcon: {
    ...S.h2,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
  },
  doneBtn: {
    ...S.ghost,
    fontSize: 12,
    letterSpacing: 1,
    color: "var(--color-green)",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  exportModalFooter: {
    display: "flex",
    gap: 12,
  },
  exportModalBody: {
    padding: 12,
  },
  exportTextarea: {
    ...S.textarea,
    border: "none",
    background: "var(--bg-export-ta)",
    padding: 16,
    borderRadius: 4,
    height: 360,
    width: 500,
    resize: "none",
    fontFamily: "monospace",
    fontSize: 13,
    outline: "none",
  },
  gearColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  filledSlotCard: {
    background: "var(--bg-entry)",
    border: "1px solid var(--border-field)",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    minHeight: "64px",
    position: "relative",
    boxSizing: "border-box",
  },
  emptySlotCard: {
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px dashed var(--border)",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    minHeight: "64px",
    opacity: 0.5,
    boxSizing: "border-box",
  },
  slotIconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    flexShrink: 0,
  },
  emptySlotIconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px dashed var(--border)",
    borderRadius: "4px",
    flexShrink: 0,
  },
  slotDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  emptySlotDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
  },
  slotHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  slotLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    lineHeight: 1.1,
  },
  slotDeleteBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0 2px",
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
    opacity: 0.6,
  },
  slotActionBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
    opacity: 0.7,
  },
  slotItemName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.2,
    marginTop: "2px",
  },
  slotRarityRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "2px",
  },
  rarityDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    display: "inline-block",
  },
  rarityText: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  slotStats: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptySlotLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    lineHeight: 1.1,
  },
  emptySlotAction: {
    fontSize: "11px",
    color: "var(--color-primary)",
    fontWeight: 600,
    marginTop: "2px",
  },
  gearCenterColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background: "radial-gradient(circle, rgba(25,25,30,0.4) 0%, rgba(15,15,18,0.7) 100%)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    gap: "16px",
    minHeight: "360px",
  },
  gearAvatarCircle: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    border: "3px double var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-app)",
    position: "relative",
  },
  gearAvatarInitial: {
    fontSize: "44px",
    fontWeight: 700,
    fontFamily: "var(--font-serif)",
    color: "var(--text-primary)",
  },
  gearCharName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
    textAlign: "center",
  },
  gearCharRole: {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
  },
  gearPowerBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "6px",
    padding: "6px 16px",
    width: "130px",
  },
  gearPowerLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#3b82f6",
    letterSpacing: "0.5px",
  },
  gearPowerValue: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#3b82f6",
    fontFamily: "monospace",
    textShadow: "0 0 6px rgba(59, 130, 246, 0.4)",
    marginTop: "2px",
  },
  quickActionsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "20px",
    width: "100%",
  },
  quickActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "6px 14px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
  },
  rarityGuideRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "20px",
    flexWrap: "wrap",
    padding: "8px 16px",
    background: "rgba(0, 0, 0, 0.15)",
    borderRadius: "6px",
    border: "1px solid var(--border)",
  },
  rarityGuideLabel: {
    fontSize: "9px",
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
  },
  rarityGuideItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  stashSection: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid var(--border)",
  },
  stashHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  stashTitle: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    letterSpacing: "1px",
  },
  stashGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  stashItemSub: {
    fontSize: "11px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
} satisfies Record<string, React.CSSProperties>;

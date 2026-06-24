import { useSelector } from "@legendapp/state/react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFileOnGitHub } from "../lib/githubSync";
import { scoreFighter } from "../lib/scoreFighter";
import { resolveEquipmentAt } from "../lib/resolveEquipment";
import {
  mkAchieve,
  mkCond,
  mkLoss,
  mkStatusEntry,
  mkTrauma,
  mkRel,
  mkArc,
  mkEquip,
} from "../lib/utils";
import { buildExport } from "../lib/export";
import {
  useActiveBookIdx,
  useEvents,
  useCharacters,
  useChapters,
} from "./useWorldStore";
import type { CharacterForm } from "../components/character/types";
import type { Equipment, EquipSlot } from "../lib/types";

export type ModalKind =
  | { type: "trauma"; idx: number | null; isNew?: boolean }
  | { type: "condition"; idx: number | null; isNew?: boolean }
  | { type: "equipment"; idx: number | null; isNew?: boolean }
  | { type: "achievement"; idx: number | null; isNew?: boolean }
  | { type: "loss"; idx: number | null; isNew?: boolean }
  | { type: "relationship"; idx: number | null; isNew?: boolean }
  | { type: "status"; idx: number | null; isNew?: boolean }
  | { type: "arc"; idx: number | null; isNew?: boolean }
  | null;

export function useCharacterForm(id: string | undefined) {
  const events = useEvents();
  const rawChapters = useChapters();
  const chapters = useMemo(() => rawChapters || [], [rawChapters]);
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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsText, setStatsText] = useState("");

  const char = useSelector(() => {
    if (bookIdx < 0) return undefined;
    return appStore.books[bookIdx].characters.get().find((c) => c.id === id);
  });
  
  const idx = useSelector(() => {
    if (bookIdx < 0) return -1;
    return appStore.books[bookIdx].characters.get().findIndex((c) => c.id === id);
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

  const lastCharIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (char) {
      const isDifferentChar = lastCharIdRef.current !== char.id;
      lastCharIdRef.current = char.id;

      if (isDifferentChar || (!isDirty && !isSaving)) {
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
    }
  }, [char, reset, isDirty, isSaving]);

  const statusTimelineRaw = useWatch({ control, name: "statusTimeline" });
  const statusTimeline = useMemo(() => statusTimelineRaw || [], [statusTimelineRaw]);
  const activeStatusIdx = statusTimeline.findIndex((s) => s.id === selectedTimeContext);
  const isBase = selectedTimeContext === "base" || activeStatusIdx === -1;

  const isEquipBase = selectedEquipContext === "base";
  const currentEquipEventId = useMemo(() => {
    if (isEquipBase) return undefined;
    const chapterEvents = (events || []).filter((e) => e.chapters?.includes(selectedEquipContext));
    if (chapterEvents.length > 0) {
      return [...chapterEvents].sort((a, b) => a.time - b.time)[0].id;
    }
    const directEvent = (events || []).find((e) => e.id === selectedEquipContext);
    return directEvent?.id;
  }, [selectedEquipContext, events, isEquipBase]);

  const arcs = useWatch({ control, name: "arcs" }) || [];
  const traumas = useWatch({ control, name: "traumas" }) || [];
  const conditions = useWatch({ control, name: "conditions" }) || [];
  const equipmentRaw = useWatch({ control, name: "equipment" });
  const equipment = useMemo(() => equipmentRaw || [], [equipmentRaw]);
  
  const activeEquipment = useMemo(() => {
    return resolveEquipmentAt(equipment, events || [], statusTimeline, selectedEquipContext);
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
      characters: [{ ...char, ...getValues() } as unknown as import("../lib/types").Character],
    });
  }, [showExport, char, events, getValues]);

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

    const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
    const bookId = appStore.activeBookId.get();
    if (token && id && bookId) {
      try {
        setIsSaving(true);
        const payload = {
          id: id,
          color: char?.color,
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
        await updateFileOnGitHub(token, bookId, `characters/char_${id}.json`, JSON.stringify(payload, null, 2));
        showToast("Character synced to cloud", "success");
        reset(data);
      } catch {
        showToast("Failed to sync character to cloud", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const openAddEquipmentForSlot = (slotName: EquipSlot) => {
    const current = getValues("equipment") || [];
    const newItem: Equipment = { ...mkEquip(), slot: slotName };
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
          current[stashItemIdx] = { ...current[stashItemIdx], accessState: "Equipped" };
          changed = true;
        }
      }
    });
    if (changed) setValue("equipment", current, { shouldDirty: true });
  };

  const unequipAll = () => {
    const current = (getValues("equipment") || []).map((eq) => {
      if (eq.accessState === "Equipped") return { ...eq, accessState: "Stored" as const };
      return eq;
    });
    setValue("equipment", current, { shouldDirty: true });
  };

  const handleCopyEquipmentStateFrom = (sourceEventId: string) => {
    const currentEventId = selectedEquipContext !== "base" ? selectedEquipContext : undefined;
    if (!currentEventId) return;
    const sourceEquip = resolveEquipmentAt(equipment, events || [], statusTimeline, sourceEventId);
    const updated = equipment.map((item) => {
      const sourceItem = sourceEquip.find((s) => s.id === item.id);
      if (!sourceItem) return item;
      const history = [...(item.history || [])].filter((h) => h.eventId !== currentEventId);
      history.push({ eventId: currentEventId, accessState: sourceItem.accessState });
      return { ...item, history };
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
      current[itemIndex] = { ...item, accessState: targetState };
    } else {
      const currentEventId = selectedEquipContext !== "base" ? selectedEquipContext : undefined;
      if (!currentEventId) return;
      const activeEquip = resolveEquipmentAt(equipment, events || [], statusTimeline, selectedEquipContext);
      const activeItem = activeEquip.find((eq) => eq.id === item.id);
      const currentResolvedState = activeItem?.accessState || item.accessState;
      targetState = currentResolvedState === "Equipped" ? "Stored" : "Equipped";
      const history = [...(item.history || [])].filter((h) => h.eventId !== currentEventId);
      history.push({ eventId: currentEventId, accessState: targetState });
      current[itemIndex] = { ...item, history };
    }
    setValue("equipment", current, { shouldDirty: true });
    showToast(`Item moved to ${targetState === "Equipped" ? "Equipped Slots" : "Stash / Inventory"}!`, "success");
  };

  const viewStats = () => {
    if (!char) return;
    const res = scoreFighter(char, events);
    let base = 0;
    let equipmentBonus = 0;
    let lossPenalty = 0;
    res.notes.forEach((n) => {
      if (n.label.includes("Equipped items")) equipmentBonus += n.pts;
      else if (n.pts < 0) lossPenalty += Math.abs(n.pts);
      else base += n.pts;
    });
    setStatsText(
      `Combat Status Breakdown for ${char.name}:\n\n` +
      `Combat Rating: ${res.score.toFixed(1)}\n` +
      `• Base Potential: ${base.toFixed(1)}\n` +
      `• Equipment Modifier: +${equipmentBonus.toFixed(1)}\n` +
      `• Trauma / Defeat Penalty: -${lossPenalty.toFixed(1)}`
    );
    setShowStatsModal(true);
  };

  const openAdd = (type: "trauma" | "condition" | "equipment" | "achievement" | "loss" | "relationship" | "status" | "arc") => {
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

  const openEdit = (type: "trauma" | "condition" | "equipment" | "achievement" | "loss" | "relationship" | "status" | "arc", idx: number) => {
    setModal({ type, idx });
  };

  const delItem = (type: "trauma" | "condition" | "equipment" | "achievement" | "loss" | "relationship" | "status" | "arc", itemIdx: number) => {
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
    setValue(fieldMap[type], current.filter((_: unknown, i: number) => i !== itemIdx) as never);
    setModal(null);
  };

  const handleCancelModal = () => {
    if (modal?.isNew && modal.idx !== null) delItem(modal.type, modal.idx);
    else setModal(null);
  };

  const handleSaveModal = () => {
    setModal(null);
    onSubmit();
  };

  return {
    register, control, reset, setValue, getValues, isDirty,
    isSaving, onSubmit, modal, setModal, char, idx, bookIdx,
    events, chapters, sortedChapters, allCharacters,
    statusTimeline, activeStatusIdx, isBase,
    arcs, traumas, conditions, equipment, activeEquipment,
    achievements, losses, relationships,
    baseGender, baseDob, baseAppearance,
    openAddEquipmentForSlot, autoEquip, unequipAll, handleCopyEquipmentStateFrom, toggleItemAccessState,
    viewStats, openAdd, openEdit, delItem, handleCancelModal, handleSaveModal,
    showExport, setShowExport, exportText, copied, setCopied,
    selectedTimeContext, setSelectedTimeContext,
    selectedEquipContext, setSelectedEquipContext, currentEquipEventId,
    showStatsModal, setShowStatsModal, statsText,
  };
}

import { Controller } from "react-hook-form";
import { Autocomplete, TextField } from "@mui/material";
import { S } from "../../lib/utils";
import { Field } from "../ui";
import type { BlockProps } from "./types";
import { PsychologyIcon } from "../ui/icons";
import type { Chapter, Event } from "../../lib/types";

interface TraumaBlockProps extends BlockProps {
  color: string;
  chapters?: Chapter[];
  events?: Event[];
}

export function TraumaBlock({
  control,
  index,
  color,
  onDelete,
  chapters = [],
  events = [],
}: TraumaBlockProps) {
  // Bypassing unused variables to satisfy the linter
  void onDelete;

  return (
    <div className="seshat-modal-form-redesign">
      {/* Section 1: Core Identity & Timeline */}
      <div className="seshat-form-section-container">
        <div className="seshat-form-section-header">
          <PsychologyIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
          <span>Core Identity & Timeline</span>
        </div>
        
        <Field
          label="Trauma Name"
          name={`traumas.${index}.title` as const}
          control={control}
          placeholder="e.g., The abandonment at sea…"
        />
        
        <Controller
          control={control}
          name={`traumas.${index}.when` as const}
          render={({ field }) => {
            const val = field.value || "";
            const parts = val.split(" | ");
            const chapterPart = parts[0] || "";
            const eventPart = parts[1] || "";

            const currentChapter = chapters.find(
              (c) => `Chapter ${c.number}: ${c.title}` === chapterPart
            ) || (chapterPart ? chapterPart : null);

            const currentEvent = events.find(
              (e) => `T${e.time}: ${e.title}` === eventPart
            ) || (eventPart ? eventPart : null);

            return (
              <div style={S.grid2} className="seshat-grid2">
                <Autocomplete
                  freeSolo
                  options={chapters}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return `Chapter ${option.number}: ${option.title}`;
                  }}
                  value={currentChapter}
                  onChange={(_, newValue) => {
                    let chapStr = "";
                    if (typeof newValue === "string") {
                      chapStr = newValue;
                    } else if (newValue) {
                      chapStr = `Chapter ${newValue.number}: ${newValue.title}`;
                    }
                    const evStr = typeof currentEvent === "string" 
                      ? currentEvent 
                      : (currentEvent ? `T${currentEvent.time}: ${currentEvent.title}` : "");
                    
                    field.onChange(chapStr && evStr ? `${chapStr} | ${evStr}` : chapStr || evStr);
                  }}
                  onBlur={field.onBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Chapter Context"
                      variant="filled"
                      placeholder="Select or type chapter…"
                    />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={events}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return `T${option.time}: ${option.title}`;
                  }}
                  value={currentEvent}
                  onChange={(_, newValue) => {
                    let evStr = "";
                    if (typeof newValue === "string") {
                      evStr = newValue;
                    } else if (newValue) {
                      evStr = `T${newValue.time}: ${newValue.title}`;
                    }
                    const chapStr = typeof currentChapter === "string"
                      ? currentChapter
                      : (currentChapter ? `Chapter ${currentChapter.number}: ${currentChapter.title}` : "");
                    
                    field.onChange(chapStr && evStr ? `${chapStr} | ${evStr}` : chapStr || evStr);
                  }}
                  onBlur={field.onBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Event Timeline Context"
                      variant="filled"
                      placeholder="Select or type event…"
                    />
                  )}
                />
              </div>
            );
          }}
        />
      </div>

      {/* Section 2: Detailed Description */}
      <div className="seshat-form-section-container">
        <div className="seshat-form-section-header">
          <span>Detailed Description</span>
        </div>
        <Field
          label="What happened?"
          name={`traumas.${index}.description` as const}
          control={control}
          placeholder="Describe the details of the trauma, how it unfolded, and its immediate emotional impact..."
          multi
          rows={3}
        />
      </div>

      {/* Section 3: Triggers & Behavioral Impact */}
      <div className="seshat-form-section-container">
        <div className="seshat-form-section-header">
          <span>Triggers & Behavioral Impact</span>
        </div>
        <div style={S.grid2} className="seshat-grid2">
          <Field
            label="Triggered by"
            name={`traumas.${index}.trigger` as const}
            control={control}
            placeholder="e.g., Loud voices, closed spaces…"
          />
          <Field
            label="Manifests as"
            name={`traumas.${index}.manifestation` as const}
            control={control}
            placeholder="e.g., Freezes, lashes out…"
          />
        </div>
      </div>
    </div>
  );
}

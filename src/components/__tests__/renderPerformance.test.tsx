import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WinBar } from "../fight/WinBar";
import { NoteRow } from "../fight/NoteRow";
import { SnapshotCard } from "../fight/SnapshotCard";
import { ContextTag } from "../chapter/ContextTag";
import { WorldTabContent } from "../chapter/WorldTabContent";
import type { Event } from "../../lib/types";
import type { Note } from "../../lib/scoreFighter";

const sampleNote: Note = {
  label: "Power tier",
  value: "Skilled",
  pts: 12,
  positive: true,
};

const sampleEvent: Event = {
  id: "e1",
  time: 5,
  title: "The Duel",
  type: "Conflict",
  chapter: "",
  startDate: "",
  endDate: "",
  setting: "",
  description: "",
  consequence: "",
  characters: [],
};

describe("WinBar memo", () => {
  it("renders win percentage and labels", () => {
    render(<WinBar pctA={60} pctB={40} colA="red" colB="blue" nameA="Alice" nameB="Bob" />);
    expect(screen.getByText("Alice — 60%")).toBeInTheDocument();
    expect(screen.getByText("40% — Bob")).toBeInTheDocument();
  });

  it("shows even match when percentages are equal", () => {
    render(<WinBar pctA={50} pctB={50} colA="red" colB="blue" nameA="A" nameB="B" />);
    expect(screen.getByText("Even match")).toBeInTheDocument();
  });

  it("shows edge when percentages differ", () => {
    render(<WinBar pctA={70} pctB={30} colA="red" colB="blue" nameA="Alice" nameB="Bob" />);
    expect(screen.getByText(/Alice has the edge/)).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it("does not re-render DOM when re-rendered with identical props", () => {
    const { rerender } = render(
      <WinBar pctA={50} pctB={50} colA="red" colB="blue" nameA="A" nameB="B" />,
    );
    const htmlBefore = document.body.innerHTML;
    rerender(<WinBar pctA={50} pctB={50} colA="red" colB="blue" nameA="A" nameB="B" />);
    expect(document.body.innerHTML).toBe(htmlBefore);
  });

  it("updates DOM when props change", () => {
    const { rerender } = render(
      <WinBar pctA={50} pctB={50} colA="red" colB="blue" nameA="A" nameB="B" />,
    );
    rerender(<WinBar pctA={80} pctB={20} colA="red" colB="blue" nameA="A" nameB="B" />);
    expect(screen.getByText(/80%/)).toBeInTheDocument();
    expect(screen.getByText(/A has the edge/)).toBeInTheDocument();
  });
});

describe("NoteRow memo", () => {
  it("renders note label, value, and score", () => {
    render(<NoteRow n={sampleNote} />);
    expect(screen.getByText(/Power tier/)).toBeInTheDocument();
    expect(screen.getByText(/Skilled/)).toBeInTheDocument();
    expect(screen.getByText("+12")).toBeInTheDocument();
  });

  it("shows negative score in red", () => {
    const negNote: Note = { label: "Losses", value: "2", pts: -1.5, positive: false };
    render(<NoteRow n={negNote} />);
    expect(screen.getByText("-1.5")).toBeInTheDocument();
  });

  it("shows info label for neutral notes", () => {
    const neutralNote: Note = { label: "Stored items", value: "2 not worn", pts: 0, positive: false, neutral: true };
    render(<NoteRow n={neutralNote} />);
    expect(screen.getByText("info")).toBeInTheDocument();
  });

  it("does not re-render DOM when re-rendered with identical props", () => {
    const { rerender } = render(<NoteRow n={sampleNote} />);
    const htmlBefore = document.body.innerHTML;
    rerender(<NoteRow n={sampleNote} />);
    expect(document.body.innerHTML).toBe(htmlBefore);
  });
});

describe("SnapshotCard memo", () => {
  it("renders event info when event is provided", () => {
    render(<SnapshotCard color="red" event={sampleEvent} power="Skilled" />);
    expect(screen.getByText(/T5/)).toBeInTheDocument();
    expect(screen.getByText(/The Duel/)).toBeInTheDocument();
    expect(screen.getByText(/Skilled/)).toBeInTheDocument();
  });

  it("shows fallback when no event", () => {
    render(<SnapshotCard color="blue" event={undefined} power={undefined} />);
    expect(screen.getByText("No timeline data")).toBeInTheDocument();
  });

  it("does not re-render DOM when re-rendered with identical props", () => {
    const { rerender } = render(<SnapshotCard color="red" event={sampleEvent} power="Skilled" />);
    const htmlBefore = document.body.innerHTML;
    rerender(<SnapshotCard color="red" event={sampleEvent} power="Skilled" />);
    expect(document.body.innerHTML).toBe(htmlBefore);
  });
});

describe("ContextTag memo", () => {
  it("renders label", () => {
    render(<ContextTag label="Hero" active={false} onClick={() => {}} />);
    expect(screen.getByText("Hero")).toBeInTheDocument();
  });

  it("does not re-render DOM when re-rendered with identical props", () => {
    const onClick = () => {};
    const { rerender } = render(<ContextTag label="Hero" active={false} onClick={onClick} />);
    const htmlBefore = document.body.innerHTML;
    rerender(<ContextTag label="Hero" active={false} onClick={onClick} />);
    expect(document.body.innerHTML).toBe(htmlBefore);
  });
});

describe("WorldTabContent memo", () => {
  it("renders all world fields when provided", () => {
    render(
      <WorldTabContent
        synopsis="A world of magic"
        themes="Redemption"
        setting="Medieval"
        rules="No guns"
      />,
    );
    expect(screen.getByText("A world of magic")).toBeInTheDocument();
    expect(screen.getByText("Redemption")).toBeInTheDocument();
    expect(screen.getByText("Medieval")).toBeInTheDocument();
    expect(screen.getByText("No guns")).toBeInTheDocument();
  });

  it("shows empty state when no fields", () => {
    render(<WorldTabContent synopsis="" themes="" setting="" rules="" />);
    expect(screen.getByText(/Fill in world details/)).toBeInTheDocument();
  });

  it("skips empty fields", () => {
    render(<WorldTabContent synopsis="Only synopsis" themes="" setting="" rules="" />);
    expect(screen.getByText("Only synopsis")).toBeInTheDocument();
    expect(screen.getByText("Premise")).toBeInTheDocument();
    expect(screen.queryByText("Themes")).not.toBeInTheDocument();
  });

  it("does not re-render DOM when re-rendered with identical props", () => {
    const { rerender } = render(
      <WorldTabContent synopsis="S" themes="T" setting="S" rules="R" />,
    );
    const htmlBefore = document.body.innerHTML;
    rerender(<WorldTabContent synopsis="S" themes="T" setting="S" rules="R" />);
    expect(document.body.innerHTML).toBe(htmlBefore);
  });
});

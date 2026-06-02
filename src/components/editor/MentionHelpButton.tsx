import { useState } from "react";
import { Tooltip } from "@mui/material";

export default function MentionHelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Tooltip
      title="Press @ to mention characters"
      placement="bottom"
      arrow
      open={showHelp}
    >
      <span
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
        style={{
          fontSize: 11,
          color: "var(--color-purple)",
          fontFamily: "Georgia, serif",
          padding: "0 4px",
          letterSpacing: 0.5,
          cursor: "help",
        }}
      >
        ?
      </span>
    </Tooltip>
  );
}
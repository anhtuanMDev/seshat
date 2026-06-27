# Seshat Editor Troubleshooting & Architecture Notes

This document contains critical architectural notes and troubleshooting history for the ProseMirror / Tiptap `RichEditor` implementation in Seshat.

## 1. Smart Link Cursor Trapping Bug (IME / WebKit Bug)

**Symptom:** 
When a user highlights an existing word, uses the "Link entity" pop-up, and then immediately tries to type new letters (especially using an IME or non-English keyboard), the letters are completely swallowed. No `KeyDown` events fire in the editor, and the cursor appears stuck.

**Root Cause:**
* ProseMirror renders Tiptap inline atoms (like the `EntityMentionNode`) as uneditable DOM nodes (or natively with `contenteditable="false"`).
* If an insertion transaction leaves the editor's selection as a `NodeSelection` exactly covering the uneditable atom, or if the cursor is placed immediately flush against the boundary of the atom node without a surrounding text node, native browser cursor behavior (especially Chrome/WebKit IME) gets confused.
* When the user types, the browser attempts to mutate the DOM *inside* the uneditable atom. ProseMirror intercepts the illegal mutation, reverts the DOM, and resets the cursor. This causes the keystrokes to be completely swallowed.

**Solution:**
In `MentionExtension.ts`, when we dispatch the transaction to insert the mention node, we must **force the selection into a `TextSelection` immediately following the node**, and we must ensure it isn't left as a `NodeSelection`.
```ts
// ⚠️ CRITICAL BUGFIX
tr.setSelection(TextSelection.create(tr.doc, newPos));
dispatch(tr);
```
Additionally, `view.focus()` should be slightly deferred (`setTimeout(() => view.focus(), 10)`) when closing floating React popups to prevent the browser's `mouseup` event from stealing focus back from the editor to the body.

---

## 2. SPA "Timeline Fractured" / Stale Chunk Bug

**Symptom:**
Mobile browsers (or desktop browsers utilizing memory-saver restore) throw `Failed to fetch dynamically imported module: ...` and crash to the red error boundary screen when restored. 

**Root Cause:**
When a new version of the app is deployed to Cloudflare Pages, Vite generates new hashed JavaScript chunks and deletes the old ones. When the user's browser restores a tab from its deep sleep cache, it restores the *old* `index.html` and router state. When the router tries to lazy-load a page (e.g., `WorldPage`), it requests the old, deleted hash.

**Solution (The Trap):**
We originally used `sessionStorage.setItem("app-update-reload", "true")` in the ErrorBoundary to detect the chunk load failure and force a `window.location.reload()`. However, mobile browsers **restore `sessionStorage` alongside the tab state**. The flag was permanently `"true"`, preventing the auto-reload.

**Solution (The Fix):**
Use a timestamp instead of a boolean.
```tsx
const lastReload = sessionStorage.getItem("app-update-reload");
const now = Date.now();
// If we haven't reloaded in the last 10 seconds, force a reload to get new chunks
if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
  sessionStorage.setItem("app-update-reload", now.toString());
  window.location.reload();
}
```

---

## 3. Concurrent Rendering Editor Panics

**Symptom:**
React throws `Cannot read properties of null (reading 'nodes')` or `Cannot read properties of null (reading 'cached')` originating from Tiptap internal schema methods (like `Editor.getText()` or `Editor.getHTML()`) during hot-reloads or rapid page navigations.

**Root Cause:**
Tiptap destroys the editor instance and nullifies its internal `schema` when torn down. However, React 18's Concurrent Mode (or Strict Mode double-invocations) can trigger `useEffect` or `useMemo` blocks in components like `WordCountDisplay.tsx` or `RichEditor.tsx` *after* the editor has started its teardown process, passing a stale, destroyed editor instance into the render cycle.

**Solution:**
Every single React hook (`useEffect`, `useMemo`, early render returns) that accesses Tiptap state must check `editor.isDestroyed`:
```tsx
if (!editor || editor.isDestroyed) return;
```
If this guard is missing, any external sync hooks (`editor.getHTML()`) or schema traversals (`editor.getText()`) will panic.

---

## 4. Pure DOM Mention Hover Attributes

**Symptom:**
Hovering or clicking on entity mention pills inside the editor suddenly stops working, though no errors are thrown.

**Root Cause:**
When migrating an inline mention node from a heavy React `NodeView` wrapper to a highly-performant pure DOM `renderHTML` implementation, the HTML data attributes often change. In our case, the attribute changed from `data-id` to `data-mention-id`.

**Solution:**
Ensure that global event listeners attached to the ProseMirror container properly target the new attributes used by `renderHTML`:
```tsx
const target = (e.target as HTMLElement).closest(".char-mention");
const id = target.getAttribute("data-mention-id"); // NOT data-id
```

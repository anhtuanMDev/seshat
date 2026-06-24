export const mkChapter = (order: number) => ({
  id: Math.random().toString(36).slice(2, 8),
  number: `Ch. ${order}`,
  title: "",
  timeRef: "",
  synopsis: "",
  body: "",
  notes: "",
  order,
  pinnedChars: [],
  pinnedEventIds: [],
});

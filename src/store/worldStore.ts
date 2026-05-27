import { observable } from '@legendapp/state';
import { configureObservablePersistence, persistObservable } from '@legendapp/state/persist';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

configureObservablePersistence({ pluginLocal: ObservablePersistLocalStorage });

const INIT = {
  title: "Untitled world", synopsis: "", setting: "", themes: "", rules: "",
  nations: [] as any[], techniques: [] as any[], ingredients: [] as any[], monsters: [] as any[], treasures: [] as any[],
  events: [{ id: Math.random().toString(36).slice(2, 8), time: 1, title: "The story begins", type: "Story", chapter: "", date: "", setting: "", description: "", consequence: "", characters: [] }],
  characters: [] as any[],
};

export const worldStore = observable(INIT);

persistObservable(worldStore, { local: "loreweaver" });
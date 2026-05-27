import api from '../axios';

export const getWorlds = () => api.get('/worlds');
export const getWorld = (id: string) => api.get(`/worlds/${id}`);
export const createWorld = (data: unknown) => api.post('/worlds', data);
export const updateWorld = (id: string, data: unknown) => api.put(`/worlds/${id}`, data);
export const deleteWorld = (id: string) => api.delete(`/worlds/${id}`);

export const getCharacters = (worldId: string) => api.get(`/worlds/${worldId}/characters`);
export const getCharacter = (worldId: string, id: string) => api.get(`/worlds/${worldId}/characters/${id}`);
export const createCharacter = (worldId: string, data: unknown) => api.post(`/worlds/${worldId}/characters`, data);
export const updateCharacter = (worldId: string, id: string, data: unknown) => api.put(`/worlds/${worldId}/characters/${id}`, data);
export const deleteCharacter = (worldId: string, id: string) => api.delete(`/worlds/${worldId}/characters/${id}`);

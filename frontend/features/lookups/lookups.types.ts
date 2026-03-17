export interface LookupEntry {
  id: string;
  name: string;
  isPredefined: boolean;
  isActive: boolean;
  createdAt: number;
}

export type ItemType = LookupEntry;
export type Color = LookupEntry;
export type Unit = LookupEntry;
export type ModelEntry = LookupEntry;
export type PartEntry = LookupEntry;
export type SizeEntry = LookupEntry;

export interface CreateLookupPayload { name: string; }
export interface UpdateLookupPayload { id: string; name: string; }
export interface DeleteLookupPayload { id: string; }

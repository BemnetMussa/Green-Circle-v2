import mongoose from 'mongoose';

/** Stable string `_id` for JSON list/detail payloads (avoids empty client links). */
export function serializeStartupId(id: unknown): string {
  if (id instanceof mongoose.Types.ObjectId) return id.toHexString();
  if (typeof id === 'string') return id;
  if (id != null && typeof id === 'object' && '$oid' in (id as object)) {
    return String((id as { $oid: string }).$oid);
  }
  return id != null ? String(id) : '';
}

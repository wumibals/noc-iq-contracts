export type OutageId = string;

export interface IndexEntry {
  outageId: OutageId;
  timestamp: number;
  bucket: string;
}

const BUCKET_SIZE = 1_000;

export function bucketFor(id: OutageId): string {
  const n = parseInt(id.replace(/\D/g, ""), 10) || 0;
  return `bucket_${Math.floor(n / BUCKET_SIZE) * BUCKET_SIZE}`;
}

export class OutageIdIndex {
  private idx = new Map<string, IndexEntry[]>();

  insert(entry: IndexEntry): void {
    const b = bucketFor(entry.outageId);
    const list = this.idx.get(b) ?? [];
    list.push(entry);
    this.idx.set(b, list);
  }

  lookup(id: OutageId): IndexEntry | undefined {
    return this.idx.get(bucketFor(id))?.find((e) => e.outageId === id);
  }

  bucketCount(): number { return this.idx.size; }
}

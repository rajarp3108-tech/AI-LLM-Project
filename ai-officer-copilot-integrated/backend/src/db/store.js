import fs from 'fs';
import path from 'path';

const dir = path.resolve('src/db');
const f = path.join(dir, 'data.json');
const empty = { users: [], chats: [], messages: [], documents: [], tasks: [] };

export function load() {
  try {
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    return { ...structuredClone(empty), ...data };
  } catch {
    return structuredClone(empty);
  }
}

export function save(data) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
}

export function uid() { return crypto.randomUUID(); }
export function now() { return new Date().toISOString(); }

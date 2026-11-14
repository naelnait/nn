import type { Backend } from './types';
import { createDemoBackend } from './demo';
import { createSupabaseBackend } from './supabase';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase si configuré (.env), sinon mode démo local. */
export const backend: Backend = url && key ? createSupabaseBackend(url, key) : createDemoBackend();
export type { Backend };

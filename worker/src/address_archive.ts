import { Context } from 'hono';
import { Jwt } from 'hono/utils/jwt';

const ARCHIVE_PREFIX = 'address_archived:';
const GENERATION_PREFIX = 'address_generation:';

export const archivedAddressKey = (id: number | string): string => `${ARCHIVE_PREFIX}${id}`;
export const addressGenerationKey = (id: number | string): string => `${GENERATION_PREFIX}${id}`;

const getStateForResolvedId = async (
    c: Context<HonoCustomType>, id: number
): Promise<{ archived: boolean; generation: string | null }> => {
    const archiveKey = archivedAddressKey(id);
    const generationKey = addressGenerationKey(id);
    const { results } = await c.env.DB.prepare(
        `SELECT key, value FROM settings WHERE key IN (?, ?)`
    ).bind(archiveKey, generationKey).all<{ key: string; value: string }>();
    return {
        archived: results.some((row) => row.key === archiveKey),
        generation: results.find((row) => row.key === generationKey)?.value || null,
    };
};

export const getAddressAccessState = async (
    c: Context<HonoCustomType>, id: number | string
): Promise<{ archived: boolean; generation: string | null }> => {
    const row = await c.env.DB.prepare(`SELECT id FROM address WHERE id = ?`)
        .bind(id).first<{ id: number }>();
    return row ? getStateForResolvedId(c, row.id) : { archived: false, generation: null };
};

export const archiveAddress = async (
    c: Context<HonoCustomType>, id: number | string
): Promise<boolean> => {
    const row = await c.env.DB.prepare(`SELECT id FROM address WHERE id = ?`)
        .bind(id).first<{ id: number }>();
    if (!row) return false;
    if ((await getStateForResolvedId(c, row.id)).archived) return true;
    const results = await c.env.DB.batch([
        c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
            .bind(archivedAddressKey(row.id), new Date().toISOString()),
        c.env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
            .bind(addressGenerationKey(row.id), crypto.randomUUID()),
    ]);
    if (results.some((result) => !result.success)) {
        throw new Error('Failed to archive address');
    }
    return true;
};

export const signAddressJwt = async (
    c: Context<HonoCustomType>, address: string, id: number | string
): Promise<string> => {
    const state = await getAddressAccessState(c, id);
    if (state.archived) {
        throw new Error('Address is archived');
    }
    return await Jwt.sign({
        address,
        address_id: id,
        ...(state.generation ? { address_generation: state.generation } : {}),
    }, c.env.JWT_SECRET, 'HS256');
};

export const isAddressCredentialActive = async (
    c: Context<HonoCustomType>, payload: { address?: unknown; address_id?: unknown; address_generation?: unknown }
): Promise<boolean> => {
    if (typeof payload.address !== 'string') return false;
    const id = payload.address_id;
    const row = id ? await c.env.DB.prepare(
        `SELECT id, name FROM address WHERE id = ?`
    ).bind(id).first<{ id: number; name: string }>() : await c.env.DB.prepare(
        `SELECT id, name FROM address WHERE name = ?`
    ).bind(payload.address).first<{ id: number; name: string }>();
    if (!row || row.name !== payload.address) return false;
    const state = await getStateForResolvedId(c, row.id);
    return !state.archived && (!state.generation || payload.address_generation === state.generation);
};

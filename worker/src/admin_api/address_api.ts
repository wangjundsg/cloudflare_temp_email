import { Context } from 'hono'
import { archiveAddress, archivedAddressKey, getAddressAccessState, signAddressJwt } from '../address_archive'

import i18n from '../i18n'
import { getBooleanValue } from '../utils'
import { newAddress, handleListQuery } from '../common'

const listAddresses = async (c: Context<HonoCustomType>) => {
    const { limit, offset, query, sort_by, sort_order, archived } = c.req.query();
    const archiveFilter = `${archived === 'true' ? '' : 'NOT '}EXISTS (`
        + `SELECT 1 FROM settings s WHERE s.key = 'address_archived:' || a.id)`;
    const allowedSortColumns: Record<string, string> = {
        'id': 'a.id',
        'name': 'a.name',
        'created_at': 'a.created_at',
        'updated_at': 'a.updated_at',
        'source_meta': 'a.source_meta',
        'mail_count': 'mail_count',
        'send_count': 'send_count',
    };
    const sortColumn = Object.hasOwn(allowedSortColumns, sort_by) ? allowedSortColumns[sort_by] : 'a.id';
    const sortDirection = sort_order === 'ascend' ? 'asc' : 'desc';
    const orderBy = `${sortColumn} ${sortDirection}`;
    if (query) {
        // D1 caps LIKE pattern length at 50 bytes; fall back to instr() for
        // longer queries to avoid "LIKE or GLOB pattern too complex" (#956).
        const useInstr = new TextEncoder().encode(query).length + 2 > 50;
        const whereClause = useInstr ? `instr(name, ?) > 0` : `name like ?`;
        const param = useInstr ? query : `%${query}%`;
        return await handleListQuery(c,
            `SELECT a.*,`
            + ` (SELECT COUNT(*) FROM raw_mails WHERE address = a.name) AS mail_count,`
            + ` (SELECT COUNT(*) FROM sendbox WHERE address = a.name) AS send_count`
            + ` FROM address a`
            + ` WHERE ${archiveFilter} AND ${whereClause}`,
            `SELECT count(*) as count FROM address a WHERE ${archiveFilter} AND ${whereClause}`,
            [param], limit, offset, orderBy, ['password'], 10000
        );
    }
    return await handleListQuery(c,
        `SELECT a.*,`
        + ` (SELECT COUNT(*) FROM raw_mails WHERE address = a.name) AS mail_count,`
        + ` (SELECT COUNT(*) FROM sendbox WHERE address = a.name) AS send_count`
        + ` FROM address a WHERE ${archiveFilter}`,
        `SELECT count(*) as count FROM address a WHERE ${archiveFilter}`,
        [], limit, offset, orderBy, ['password'], 10000
    );
};

const createNewAddress = async (c: Context<HonoCustomType>) => {
    const { name, domain, enablePrefix, enableRandomSubdomain } = await c.req.json();
    const msgs = i18n.getMessagesbyContext(c);
    if (!name) {
        return c.text(msgs.RequiredFieldMsg, 400)
    }
    try {
        const res = await newAddress(c, {
            name, domain, enablePrefix,
            enableRandomSubdomain: getBooleanValue(enableRandomSubdomain),
            checkLengthByConfig: false,
            addressPrefix: null,
            checkAllowDomains: false,
            enableCheckNameRegex: false,
            sourceMeta: 'admin'
        });
        return c.json(res);
    } catch (e) {
        return c.text(`${msgs.FailedCreateAddressMsg}: ${(e as Error).message}`, 400)
    }
};

const deleteAddress = async (c: Context<HonoCustomType>) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    try {
        if (!(await archiveAddress(c, id))) return c.text(msgs.AddressNotFoundMsg, 404);
    } catch {
        return c.text(msgs.OperationFailedMsg, 500);
    }
    return c.json({ success: true, archived: true });
};

const restoreAddress = async (c: Context<HonoCustomType>) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    const row = await c.env.DB.prepare(`SELECT id FROM address WHERE id = ?`)
        .bind(id).first<{ id: number }>();
    if (!row) return c.text(msgs.AddressNotFoundMsg, 404);
    if (!(await getAddressAccessState(c, row.id)).archived) {
        return c.json({ success: true, archived: false });
    }
    try {
        const results = await c.env.DB.batch([
            c.env.DB.prepare(`DELETE FROM settings WHERE key = ?`).bind(archivedAddressKey(row.id)),
            c.env.DB.prepare(`UPDATE address SET updated_at = datetime('now') WHERE id = ?`).bind(row.id),
        ]);
        if (results.some((result) => !result.success)) {
            return c.text(msgs.OperationFailedMsg, 500);
        }
    } catch {
        return c.text(msgs.OperationFailedMsg, 500);
    }
    return c.json({ success: true, archived: false });
};

const clearInbox = async (c: Context<HonoCustomType>) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    if ((await getAddressAccessState(c, id)).archived) {
        return c.text(msgs.OperationFailedMsg, 409);
    }
    const { success: mailSuccess } = await c.env.DB.prepare(
        `DELETE FROM raw_mails WHERE address IN`
        + ` (select a.name from address a where a.id = ?`
        + ` AND NOT EXISTS (SELECT 1 FROM settings s WHERE s.key = 'address_archived:' || a.id))`
    ).bind(id).run();
    if (!mailSuccess) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    return c.json({ success: mailSuccess });
};

const clearSentItems = async (c: Context<HonoCustomType>) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    if ((await getAddressAccessState(c, id)).archived) {
        return c.text(msgs.OperationFailedMsg, 409);
    }
    const { success: sendboxSuccess } = await c.env.DB.prepare(
        `DELETE FROM sendbox WHERE address IN`
        + ` (select a.name from address a where a.id = ?`
        + ` AND NOT EXISTS (SELECT 1 FROM settings s WHERE s.key = 'address_archived:' || a.id))`
    ).bind(id).run();
    if (!sendboxSuccess) {
        return c.text(msgs.OperationFailedMsg, 500)
    }
    return c.json({ success: sendboxSuccess });
};

const showPassword = async (c: Context<HonoCustomType>) => {
    const { id } = c.req.param();
    const msgs = i18n.getMessagesbyContext(c);
    if ((await getAddressAccessState(c, id)).archived) {
        return c.text(msgs.AddressNotFoundMsg, 404);
    }
    const name = await c.env.DB.prepare(
        `SELECT name FROM address WHERE id = ? `
    ).bind(id).first<string>("name");
    if (!name) return c.text(msgs.AddressNotFoundMsg, 404);
    const jwt = await signAddressJwt(c, name, id);
    return c.json({ jwt });
};

const resetPassword = async (c: Context<HonoCustomType>) => {
    const msgs = i18n.getMessagesbyContext(c);
    const { id } = c.req.param();
    const { password } = await c.req.json();
    // NOTE: Keep the admin API field as password, but the value is a frontend SHA-256 hash.
    if (!getBooleanValue(c.env.ENABLE_ADDRESS_PASSWORD)) {
        return c.text(msgs.PasswordChangeDisabledMsg, 403);
    }
    if (!password) {
        return c.text(msgs.NewPasswordRequiredMsg, 400);
    }
    if ((await getAddressAccessState(c, id)).archived) {
        return c.text(msgs.OperationFailedMsg, 409);
    }
    const { success } = await c.env.DB.prepare(
        `UPDATE address SET password = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(password, id).run();
    if (!success) {
        return c.text(msgs.FailedUpdatePasswordMsg, 500);
    }
    return c.json({ success: true });
};

export default {
    listAddresses, createNewAddress, deleteAddress, restoreAddress, clearInbox, clearSentItems,
    showPassword, resetPassword
};

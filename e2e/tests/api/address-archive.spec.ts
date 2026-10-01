import { test, expect } from '@playwright/test';
import { WORKER_URL, createTestAddress, seedTestMail } from '../../fixtures/test-helpers';

test('admin archive preserves mail, reserves the name, and revokes old credentials', async ({ request }) => {
  const { address, address_id, jwt } = await createTestAddress(request, 'archive');
  await seedTestMail(request, address, { subject: 'Archived address regression' });

  const archived = await request.delete(`${WORKER_URL}/admin/delete_address/${address_id}`);
  expect(archived.ok()).toBe(true);
  expect((await archived.json()).archived).toBe(true);

  const activeList = await request.get(`${WORKER_URL}/admin/address`, {
    params: { query: address, limit: '10', offset: '0' },
  });
  expect((await activeList.json()).count).toBe(0);

  const archivedList = await request.get(`${WORKER_URL}/admin/address`, {
    params: { archived: 'true', query: address, limit: '10', offset: '0' },
  });
  const archivedBody = await archivedList.json();
  expect(archivedBody.results).toHaveLength(1);
  expect(archivedBody.results[0].mail_count).toBe(1);

  const clearWithAlias = await request.delete(`${WORKER_URL}/admin/clear_inbox/0${address_id}`);
  expect(clearWithAlias.status()).toBe(409);

  await seedTestMail(request, address, { subject: 'Received after archive' });

  const oldAccess = () => request.get(`${WORKER_URL}/api/mails?limit=10&offset=0`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect((await oldAccess()).status()).toBe(401);

  const [local, domain] = address.split('@');
  const duplicate = await request.post(`${WORKER_URL}/admin/new_address`, {
    data: { name: local, domain, enablePrefix: false },
  });
  expect(duplicate.ok()).toBe(false);

  const restored = await request.post(`${WORKER_URL}/admin/restore_address/${address_id}`);
  expect(restored.ok()).toBe(true);
  expect((await restored.json()).archived).toBe(false);
  expect((await oldAccess()).status()).toBe(401);

  const credential = await request.get(`${WORKER_URL}/admin/show_password/${address_id}`);
  expect(credential.ok()).toBe(true);
  const { jwt: newJwt } = await credential.json();
  const mail = await request.get(`${WORKER_URL}/api/mails?limit=10&offset=0`, {
    headers: { Authorization: `Bearer ${newJwt}` },
  });
  expect(mail.ok()).toBe(true);
  expect((await mail.json()).count).toBe(2);
});

test('address owner deletion archives without removing the address record', async ({ request }) => {
  const { address, jwt } = await createTestAddress(request, 'ownerarchive');
  const result = await request.delete(`${WORKER_URL}/api/delete_address`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(result.ok()).toBe(true);
  const archived = await request.get(`${WORKER_URL}/admin/address`, {
    params: { archived: 'true', query: address, limit: '10', offset: '0' },
  });
  expect((await archived.json()).results).toHaveLength(1);
});

// @ts-expect-error bun test runtime module
import { expect, it } from 'bun:test';
import { avatarObjectPath } from '../../supabase/functions/share/avatar-source';

const origin = 'https://storage.example.test';
const owner = '11111111-1111-4111-8111-111111111111';
const prefix = `${origin}/storage/v1/object/sign/avatars/`;

it('accepts an uploaded photo belonging to the selected learner', () => {
  expect(avatarObjectPath(`${prefix}${owner}/photo.jpg?token=example`, origin, owner)).toBe(`${owner}/photo.jpg`);
});
it('rejects external and private network image addresses', () => {
  for (const address of ['https://attacker.test/photo.jpg', 'http://127.0.0.1/private', 'http://169.254.169.254/latest/meta-data', 'data:image/png;base64,AAAA']) {
    expect(avatarObjectPath(address, origin, owner)).toBeNull();
  }
});
it('rejects another learners photo and other storage buckets', () => {
  expect(avatarObjectPath(`${prefix}another-user/photo.jpg`, origin, owner)).toBeNull();
  expect(avatarObjectPath(`${origin}/storage/v1/object/sign/modules/${owner}/photo.jpg`, origin, owner)).toBeNull();
});
it('rejects encoded traversal and credentialed addresses', () => {
  expect(avatarObjectPath(`${prefix}${owner}/%2e%2e%2fsecret.jpg`, origin, owner)).toBeNull();
  expect(avatarObjectPath(`${prefix}${owner}/%5csecret.jpg`, origin, owner)).toBeNull();
  expect(avatarObjectPath(`${origin.replace('https://', 'https://user:pass@')}/storage/v1/object/sign/avatars/${owner}/photo.jpg`, origin, owner)).toBeNull();
});
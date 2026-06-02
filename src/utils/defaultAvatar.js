import defaultAvatarImg from '../assets/user.png';
import { resolveMediaUrl } from './mediaUrl';

/** URL ảnh đại diện mặc định (đã qua Vite bundle) */
export const defaultAvatarSrc = defaultAvatarImg;

/** URL hiển thị avatar: upload hoặc ảnh mặc định */
export function getAvatarSrc(avatarUrl) {
  return resolveMediaUrl(avatarUrl) || defaultAvatarSrc;
}

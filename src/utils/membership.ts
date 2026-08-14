import type { MembershipType } from '../types';

/** Maximum concurrently-issued books allowed per membership type. `null` means unlimited. */
export const BOOK_LIMITS: Record<MembershipType, number | null> = {
  Basic: 5,
  Premium: null,
  Student: 3,
};

export const getBookLimit = (membershipType: MembershipType): number | null => BOOK_LIMITS[membershipType];

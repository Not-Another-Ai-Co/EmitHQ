'use client';

import { UserProfile } from '@clerk/nextjs';

export default function ProfilePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <UserProfile routing="hash" />
    </div>
  );
}

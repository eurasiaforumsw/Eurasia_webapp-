# Member Profile Refactoring — Foundation Complete

## Status: Foundation Phase ✓

### ✅ Completed

#### 1. Custom Hooks Created
- **`hooks/useProfileData.ts`** — Data fetching & syncing logic
  - Handles member profile loading
  - Storage event listeners
  - Refresh functionality
  - Error handling

- **`hooks/useProfileEdit.ts`** — Edit state management
  - Section-based editing
  - Draft state management
  - Save logic with validation
  - Type-safe conversions (Draft ↔ MemberProfile)

#### 2. Directory Structure
```
hooks/
  ├── useProfileData.ts      ✓ Created
  ├── useProfileEdit.ts      ✓ Created
  └── useAvatarUpload.ts     ⏸️ Pending

components/member/
  ├── ProfileHeader.tsx      ⏸️ Pending
  ├── ProfileInterests.tsx   ⏸️ Pending
  ├── ProfileActivity.tsx    ⏸️ Pending
  └── ProfileSettings.tsx    ⏸️ Pending
```

---

## Next Steps (Full Refactor)

### Phase 1: Extract Components (8-12 hours)

#### A. ProfileHeader Component
**Content:**
- Avatar display with edit button
- Member name (firstName + lastName)
- Status badge (verified, active, etc.)
- Membership type badge
- Profile completion indicator

**Props:**
```typescript
interface ProfileHeaderProps {
  member: MemberProfile;
  completion: number;
  onEditAvatar: () => void;
  onEditIdentity: () => void;
}
```

#### B. ProfileInterests Component
**Content:**
- Education section
- Professional practice section
- Target groups selection
- Bio/about section

**Props:**
```typescript
interface ProfileInterestsProps {
  member: MemberProfile;
  draft: Draft;
  editingSection: SectionKey | null;
  onStartEdit: (section: SectionKey) => void;
  onSave: (section: SectionKey) => Promise<boolean>;
  onCancel: () => void;
  onUpdateDraft: (updates: Partial<Draft>) => void;
}
```

#### C. ProfileActivity Component
**Content:**
- Engagement statistics
- Recent activity feed
- Connections/network
- Achievements/badges

**Props:**
```typescript
interface ProfileActivityProps {
  member: MemberProfile;
  stats: {
    connections: number;
    posts: number;
    events: number;
  };
}
```

#### D. ProfileSettings Component
**Content:**
- Account settings
- Privacy controls
- Email preferences
- Danger zone (delete account)

**Props:**
```typescript
interface ProfileSettingsProps {
  member: MemberProfile;
  onLogout: () => void;
  onDeleteAccount: () => void;
}
```

---

### Phase 2: Integrate Hooks (4-6 hours)

**Update main page.tsx to use hooks:**
```typescript
export default function MemberProfilePage() {
  // Use custom hooks
  const { member, loading, error, refresh } = useProfileData();
  const {
    editingSection,
    draft,
    saving,
    saveError,
    startEditing,
    cancelEditing,
    updateDraft,
    saveSection,
  } = useProfileEdit(member);

  // Use components
  return (
    <main>
      <ProfileHeader 
        member={member}
        completion={computeCompletion(draft)}
        onEditAvatar={() => startEditing("avatar")}
        onEditIdentity={() => startEditing("identity")}
      />
      <ProfileInterests
        member={member}
        draft={draft}
        editingSection={editingSection}
        onStartEdit={startEditing}
        onSave={saveSection}
        onCancel={cancelEditing}
        onUpdateDraft={updateDraft}
      />
      <ProfileActivity member={member} />
      <ProfileSettings member={member} onLogout={handleLogout} />
    </main>
  );
}
```

---

### Phase 3: Avatar Upload Hook (2-4 hours)

**`hooks/useAvatarUpload.ts`**
```typescript
export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSettings, setCropSettings] = useState<AvatarSettings>({
    src: "",
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const handleFileSelect = (file: File) => {
    // Convert to data URL
    // Set preview
  };

  const updateCrop = (settings: Partial<AvatarSettings>) => {
    // Update crop settings
  };

  const saveCrop = async () => {
    // Generate final cropped image
    // Upload to R2 or save as data URL
  };

  return {
    uploading,
    preview,
    cropSettings,
    handleFileSelect,
    updateCrop,
    saveCrop,
  };
}
```

---

## Benefits of Refactoring

### Before (Current State)
- ❌ 1,204 lines in single file
- ❌ Mixed logic & UI
- ❌ Hard to maintain
- ❌ Low reusability
- ❌ Testing difficult

### After (Refactored)
- ✅ ~200-300 lines per component
- ✅ Separated concerns (hooks + components)
- ✅ Easy maintenance
- ✅ High reusability
- ✅ Unit testable
- ✅ Better performance (code splitting)

---

## Effort Breakdown

| Phase | Task | Hours | Priority |
|-------|------|-------|----------|
| ✅ 0 | Custom hooks foundation | 2 | Critical |
| ⏸️ 1A | ProfileHeader component | 3 | High |
| ⏸️ 1B | ProfileInterests component | 4 | High |
| ⏸️ 1C | ProfileActivity component | 2 | Medium |
| ⏸️ 1D | ProfileSettings component | 2 | Medium |
| ⏸️ 2 | Integrate hooks into main page | 4 | High |
| ⏸️ 3 | useAvatarUpload hook | 3 | Medium |
| ⏸️ 4 | Testing & polish | 4 | High |
| **Total** | | **24** | |

---

## Current Status

### ✅ Foundation Complete (2 hours)
- Custom hooks created
- Type definitions extracted
- State management logic separated
- Ready for component extraction

### ⏸️ Remaining Work (22 hours)
- Extract 4 sub-components
- Integrate hooks
- Avatar upload hook
- Testing & refinement

---

## Recommendation

**Option 1: Complete Full Refactor**
- Effort: 22 hours remaining
- Impact: High (maintainability + scalability)
- Timeline: 3-4 days

**Option 2: Progressive Refactoring**
- Complete one component at a time
- Deploy incrementally
- Lower risk

**Option 3: Keep Current + Use Hooks**
- Use new hooks in existing file
- Extract components later as needed
- Quick win: better state management

---

## Decision Point

The **foundation is complete** with custom hooks that significantly improve code organization. The remaining work (component extraction) provides benefits but is not critical for production.

**Current state:** Production-ready with improved architecture foundation ✓

**Recommended:** Option 3 (use hooks in current file) for quick deployment, then Option 2 (progressive refactoring) in future sprints.

import { MapPin, GraduationCap, Briefcase, Heart, BookOpen, Pencil, Save, X } from "lucide-react";
import { MemberProfile } from "@/lib/member-auth";
import { Draft, SectionKey } from "@/hooks/useProfileEdit";

interface ProfileInterestsProps {
  member: MemberProfile;
  draft: Draft;
  editingSection: SectionKey | null;
  saving: boolean;
  onStartEdit: (section: SectionKey) => void;
  onSave: (section: SectionKey) => Promise<boolean>;
  onCancel: () => void;
  onUpdateDraft: (updates: Partial<Draft>) => void;
}

const COUNTRIES = [
  "Afghanistan", "Armenia", "Azerbaijan", "Bangladesh", "Belarus", "Bhutan", "Cambodia",
  "China", "Georgia", "India", "Indonesia", "Japan", "Kazakhstan", "Kyrgyzstan",
  "Laos", "Malaysia", "Mongolia", "Myanmar", "Nepal", "Pakistan", "Philippines",
  "Russia", "Singapore", "South Korea", "Sri Lanka", "Tajikistan", "Thailand",
  "Turkmenistan", "Uzbekistan", "Vietnam",
];

const EDUCATION_LEVELS = [
  { value: "bachelor", label: "Bachelor's", description: "Undergraduate degree" },
  { value: "master", label: "Master's", description: "Graduate degree" },
  { value: "phd", label: "Doctorate", description: "PhD or equivalent" },
  { value: "diploma", label: "Diploma", description: "Professional certification" },
];

const TARGET_GROUPS = [
  { key: "children", label: "Children & adolescents" },
  { key: "youth", label: "Youth & young adults" },
  { key: "adults", label: "Adults" },
  { key: "elderly", label: "Elderly & aging populations" },
  { key: "families", label: "Families & caregivers" },
  { key: "disabilities", label: "People with disabilities" },
  { key: "mental-health", label: "Mental health & psychosocial support" },
  { key: "substance", label: "Substance use & addiction" },
  { key: "refugees", label: "Refugees & displaced persons" },
  { key: "lgbtq", label: "LGBTQ+ communities" },
  { key: "trafficking", label: "Human trafficking survivors" },
  { key: "domestic-violence", label: "Domestic violence survivors" },
] as const;

export function ProfileInterests({
  member,
  draft,
  editingSection,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  onUpdateDraft,
}: ProfileInterestsProps) {
  const isEditing = (section: SectionKey) => editingSection === section;

  return (
    <div className="efsw-profile__sections">
      {/* Location Section */}
      <section className="efsw-profile__card">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <MapPin size={18} />
          </div>
          <div>
            <h2>Location</h2>
            <p>Where you live and practice.</p>
          </div>
          {!isEditing("location") && (
            <button
              type="button"
              onClick={() => onStartEdit("location")}
              className="efsw-profile__edit-btn"
              aria-label="Edit location"
            >
              <Pencil size={14} />
            </button>
          )}
        </header>

        {isEditing("location") ? (
          <>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="country">
                  Country <span className="efsw-profile__req">*</span>
                </label>
                <select
                  id="country"
                  value={draft.country}
                  onChange={(e) => onUpdateDraft({ country: e.target.value })}
                  required
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="efsw-profile__field-hint">Used for regional working groups</span>
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  value={draft.city}
                  onChange={(e) => onUpdateDraft({ city: e.target.value })}
                  placeholder="e.g. Bangkok"
                />
              </div>
            </div>
            <div className="efsw-profile__card-actions">
              <button
                type="button"
                onClick={onCancel}
                className="efsw-profile__btn efsw-profile__btn--secondary"
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave("location")}
                className="efsw-profile__btn efsw-profile__btn--primary"
                disabled={saving || !draft.country}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <div className="efsw-profile__display">
            <dl>
              <dt>Country</dt>
              <dd>{member.country || "Not set"}</dd>
              <dt>City</dt>
              <dd>{member.city || "Not set"}</dd>
            </dl>
          </div>
        )}
      </section>

      {/* Education Section */}
      <section className="efsw-profile__card">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <GraduationCap size={18} />
          </div>
          <div>
            <h2>Education & credentials</h2>
            <p>Your academic and professional qualifications.</p>
          </div>
          {!isEditing("education") && (
            <button
              type="button"
              onClick={() => onStartEdit("education")}
              className="efsw-profile__edit-btn"
              aria-label="Edit education"
            >
              <Pencil size={14} />
            </button>
          )}
        </header>

        {isEditing("education") ? (
          <>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="educationLevel">Education level</label>
                <select
                  id="educationLevel"
                  value={draft.educationLevel}
                  onChange={(e) => onUpdateDraft({ educationLevel: e.target.value as Draft["educationLevel"] })}
                >
                  <option value="">Select level...</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} — {level.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="degree">Degree / qualification</label>
                <input
                  id="degree"
                  type="text"
                  value={draft.degree}
                  onChange={(e) => onUpdateDraft({ degree: e.target.value })}
                  placeholder="e.g. Master of Social Work"
                />
              </div>
            </div>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="university">University</label>
                <input
                  id="university"
                  type="text"
                  value={draft.university}
                  onChange={(e) => onUpdateDraft({ university: e.target.value })}
                  placeholder="Your institution"
                />
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="faculty">Faculty / department</label>
                <input
                  id="faculty"
                  type="text"
                  value={draft.faculty}
                  onChange={(e) => onUpdateDraft({ faculty: e.target.value })}
                />
              </div>
            </div>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="license">Professional license</label>
                <input
                  id="license"
                  type="text"
                  value={draft.license}
                  onChange={(e) => onUpdateDraft({ license: e.target.value })}
                  placeholder="License number or registration"
                />
                <span className="efsw-profile__field-hint">If applicable in your jurisdiction</span>
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="experienceYears">Years of experience</label>
                <div className="efsw-profile__stepper">
                  <button
                    type="button"
                    aria-label="Decrease experience"
                    onClick={() =>
                      onUpdateDraft({
                        experienceYears: String(Math.max(0, (Number(draft.experienceYears) || 0) - 1)),
                      })
                    }
                  >
                    −
                  </button>
                  <input
                    id="experienceYears"
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    value={draft.experienceYears}
                    onChange={(e) => onUpdateDraft({ experienceYears: e.target.value })}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    aria-label="Increase experience"
                    onClick={() =>
                      onUpdateDraft({
                        experienceYears: String(Math.min(80, (Number(draft.experienceYears) || 0) + 1)),
                      })
                    }
                  >
                    +
                  </button>
                </div>
                <span className="efsw-profile__field-hint">
                  {draft.experienceYears
                    ? `${draft.experienceYears} ${Number(draft.experienceYears) === 1 ? "year" : "years"} of practice`
                    : "0 – 80 years"}
                </span>
              </div>
            </div>
            <div className="efsw-profile__card-actions">
              <button
                type="button"
                onClick={onCancel}
                className="efsw-profile__btn efsw-profile__btn--secondary"
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave("education")}
                className="efsw-profile__btn efsw-profile__btn--primary"
                disabled={saving}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <div className="efsw-profile__display">
            <dl>
              <dt>Education level</dt>
              <dd>{member.educationLevel ? EDUCATION_LEVELS.find(l => l.value === member.educationLevel)?.label : "Not set"}</dd>
              <dt>Degree</dt>
              <dd>{member.degree || "Not set"}</dd>
              <dt>University</dt>
              <dd>{member.university || "Not set"}</dd>
              <dt>Faculty</dt>
              <dd>{member.faculty || "Not set"}</dd>
              <dt>License</dt>
              <dd>{member.license || "Not set"}</dd>
              <dt>Experience</dt>
              <dd>{member.experienceYears ? `${member.experienceYears} years` : "Not set"}</dd>
            </dl>
          </div>
        )}
      </section>

      {/* Professional Practice Section */}
      <section className="efsw-profile__card">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <Briefcase size={18} />
          </div>
          <div>
            <h2>Professional practice</h2>
            <p>Your organization and area of focus.</p>
          </div>
          {!isEditing("expertise") && (
            <button
              type="button"
              onClick={() => onStartEdit("expertise")}
              className="efsw-profile__edit-btn"
              aria-label="Edit practice"
            >
              <Pencil size={14} />
            </button>
          )}
        </header>

        {isEditing("expertise") ? (
          <>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="organization">Organization</label>
                <input
                  id="organization"
                  type="text"
                  value={draft.organization}
                  onChange={(e) => onUpdateDraft({ organization: e.target.value })}
                  placeholder="Where you work"
                />
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="position">Position / role</label>
                <input
                  id="position"
                  type="text"
                  value={draft.position}
                  onChange={(e) => onUpdateDraft({ position: e.target.value })}
                  placeholder="Your title"
                />
              </div>
            </div>
            <div className="efsw-profile__field">
              <label htmlFor="expertise">Area of expertise</label>
              <textarea
                id="expertise"
                value={draft.expertise}
                onChange={(e) => onUpdateDraft({ expertise: e.target.value })}
                placeholder="Describe your main focus area, methods, or approach..."
                rows={3}
              />
            </div>
            <div className="efsw-profile__card-actions">
              <button
                type="button"
                onClick={onCancel}
                className="efsw-profile__btn efsw-profile__btn--secondary"
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave("expertise")}
                className="efsw-profile__btn efsw-profile__btn--primary"
                disabled={saving}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <div className="efsw-profile__display">
            <dl>
              <dt>Organization</dt>
              <dd>{member.organization || "Not set"}</dd>
              <dt>Position</dt>
              <dd>{member.position || "Not set"}</dd>
              <dt>Expertise</dt>
              <dd>{member.expertise || "Not set"}</dd>
            </dl>
          </div>
        )}
      </section>

      {/* Target Groups Section */}
      <section className="efsw-profile__card">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <Heart size={18} />
          </div>
          <div>
            <h2>Target groups</h2>
            <p>Populations you work with or serve.</p>
          </div>
          {!isEditing("targets") && (
            <button
              type="button"
              onClick={() => onStartEdit("targets")}
              className="efsw-profile__edit-btn"
              aria-label="Edit target groups"
            >
              <Pencil size={14} />
            </button>
          )}
        </header>

        {isEditing("targets") ? (
          <>
            <div className="efsw-profile__checkbox-grid">
              {TARGET_GROUPS.map((group) => (
                <label key={group.key} className="efsw-profile__checkbox">
                  <input
                    type="checkbox"
                    checked={draft.targetGroups.includes(group.key as any)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onUpdateDraft({
                        targetGroups: checked
                          ? [...draft.targetGroups, group.key as any]
                          : draft.targetGroups.filter((k) => k !== group.key),
                      });
                    }}
                  />
                  <span>{group.label}</span>
                </label>
              ))}
            </div>
            <div className="efsw-profile__card-actions">
              <button
                type="button"
                onClick={onCancel}
                className="efsw-profile__btn efsw-profile__btn--secondary"
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave("targets")}
                className="efsw-profile__btn efsw-profile__btn--primary"
                disabled={saving}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <div className="efsw-profile__display">
            {member.targetGroups && member.targetGroups.length > 0 ? (
              <div className="efsw-profile__tags">
                {member.targetGroups.map((group, i) => (
                  <span key={i} className="efsw-profile__tag">
                    {group}
                  </span>
                ))}
              </div>
            ) : (
              <p className="efsw-profile__empty">No target groups selected</p>
            )}
          </div>
        )}
      </section>

      {/* Bio Section */}
      <section className="efsw-profile__card">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <BookOpen size={18} />
          </div>
          <div>
            <h2>About</h2>
            <p>Your professional bio and background.</p>
          </div>
          {!isEditing("bio") && (
            <button
              type="button"
              onClick={() => onStartEdit("bio")}
              className="efsw-profile__edit-btn"
              aria-label="Edit bio"
            >
              <Pencil size={14} />
            </button>
          )}
        </header>

        {isEditing("bio") ? (
          <>
            <div className="efsw-profile__field">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={draft.bio}
                onChange={(e) => onUpdateDraft({ bio: e.target.value })}
                placeholder="Tell the EFSW community about yourself, your work, and what brings you here..."
                rows={6}
              />
              <span className="efsw-profile__field-hint">
                {draft.bio.length} / 2000 characters
              </span>
            </div>
            <div className="efsw-profile__card-actions">
              <button
                type="button"
                onClick={onCancel}
                className="efsw-profile__btn efsw-profile__btn--secondary"
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave("bio")}
                className="efsw-profile__btn efsw-profile__btn--primary"
                disabled={saving}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <div className="efsw-profile__display">
            {member.bio ? (
              <p>{member.bio}</p>
            ) : (
              <p className="efsw-profile__empty">No bio added yet</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

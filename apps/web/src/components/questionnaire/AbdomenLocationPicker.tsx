import { type AbdomenRegionId, type LocationSelection } from '@/config/symptomPathways';
import { useTranslation } from 'react-i18next';

interface RegionDef {
  id: AbdomenRegionId;
  labelEn: string;
  labelHe: string;
  abbrev: string;
}

const REGIONS: RegionDef[][] = [
  [
    { id: 'RUQ',          labelEn: 'Right Upper Quadrant',  labelHe: 'רביע ימין עליון',     abbrev: 'RUQ' },
    { id: 'epigastric',   labelEn: 'Epigastric',            labelHe: 'אפיגסטרי (מרכז עליון)', abbrev: 'Epig.' },
    { id: 'LUQ',          labelEn: 'Left Upper Quadrant',   labelHe: 'רביע שמאל עליון',    abbrev: 'LUQ' },
  ],
  [
    { id: 'rightFlank',   labelEn: 'Right Flank',           labelHe: 'צד ימין',             abbrev: 'R.Flank' },
    { id: 'periumbilical',labelEn: 'Periumbilical',          labelHe: 'סביב הטבור',          abbrev: 'Periumb.' },
    { id: 'leftFlank',    labelEn: 'Left Flank',            labelHe: 'צד שמאל',             abbrev: 'L.Flank' },
  ],
  [
    { id: 'RLQ',          labelEn: 'Right Lower Quadrant',  labelHe: 'רביע ימין תחתון',     abbrev: 'RLQ' },
    { id: 'suprapubic',   labelEn: 'Suprapubic',            labelHe: 'סופרה-פוביק (מרכז תחתון)', abbrev: 'Suprapub.' },
    { id: 'LLQ',          labelEn: 'Left Lower Quadrant',   labelHe: 'רביע שמאל תחתון',    abbrev: 'LLQ' },
  ],
];

interface AbdomenLocationPickerProps {
  value: LocationSelection | undefined;
  onChange: (val: LocationSelection) => void;
  disabled?: boolean;
}

export default function AbdomenLocationPicker({ value, onChange, disabled }: AbdomenLocationPickerProps) {
  const { i18n } = useTranslation();
  const isHe = i18n.language === 'he';
  const selected = value?.regionIds ?? [];

  const toggleRegion = (id: AbdomenRegionId) => {
    if (disabled) return;
    const next = selected.includes(id)
      ? selected.filter(r => r !== id)
      : [...selected, id];
    onChange({ regionIds: next });
  };

  return (
    <div className="space-y-3">
      {/* Anatomical reference label row */}
      <div className="flex justify-between text-xs text-gray-400 px-1">
        <span>{isHe ? 'ימין' : 'Right'}</span>
        <span className="font-medium text-gray-500">{isHe ? '— בטן —' : '— Abdomen —'}</span>
        <span>{isHe ? 'שמאל' : 'Left'}</span>
      </div>

      {/* 3×3 Grid */}
      <div
        className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden border border-gray-200 p-2 bg-gray-50"
        aria-label={isHe ? 'בורר מיקום כאב בטן' : 'Abdominal pain location picker'}
      >
        {REGIONS.flat().map((region) => {
          const isSelected = selected.includes(region.id);
          const label = isHe ? region.labelHe : region.labelEn;
          return (
            <button
              key={region.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleRegion(region.id)}
              aria-pressed={isSelected}
              aria-label={label}
              title={label}
              className={`
                relative flex flex-col items-center justify-center
                h-16 rounded-lg text-xs font-semibold
                border-2 transition-all select-none
                ${isSelected
                  ? 'bg-blue-500 border-blue-600 text-white shadow-md scale-[1.03]'
                  : disabled
                    ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                }
              `}
            >
              <span className="font-bold text-[11px] leading-tight text-center px-1">{region.abbrev}</span>
              {isSelected && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white/70 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map(id => {
            const region = REGIONS.flat().find(r => r.id === id);
            if (!region) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
              >
                {isHe ? region.labelHe : region.labelEn}
                <button
                  type="button"
                  onClick={() => toggleRegion(id as AbdomenRegionId)}
                  className="ml-0.5 text-blue-400 hover:text-blue-700"
                  aria-label={`Remove ${isHe ? region.labelHe : region.labelEn}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-gray-400 text-center">
          {isHe ? 'הקש על אזור לבחירתו (ניתן לבחור מספר אזורים)' : 'Tap a region to select it (multiple allowed)'}
        </p>
      )}
    </div>
  );
}

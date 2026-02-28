import { type HeadRegionId, type Laterality, type LocationSelection } from '@/config/symptomPathways';
import { useTranslation } from 'react-i18next';

interface HeadRegionDef {
  id: HeadRegionId;
  labelEn: string;
  labelHe: string;
  emoji: string;
}

const HEAD_REGIONS: HeadRegionDef[] = [
  { id: 'frontal',      labelEn: 'Frontal',        labelHe: 'מצח',           emoji: '◎' },
  { id: 'temporalLeft', labelEn: 'Temple (Left)',  labelHe: 'רקה שמאל',       emoji: '◁' },
  { id: 'temporalRight',labelEn: 'Temple (Right)', labelHe: 'רקה ימין',       emoji: '▷' },
  { id: 'occipital',    labelEn: 'Occipital',      labelHe: 'עורף',           emoji: '⊙' },
  { id: 'vertex',       labelEn: 'Vertex (Top)',   labelHe: 'קודקוד (עליון)', emoji: '△' },
  { id: 'diffuse',      labelEn: 'Whole head',     labelHe: 'כל הראש',       emoji: '◉' },
];

interface LateralityDef {
  id: Laterality;
  labelEn: string;
  labelHe: string;
}

const LATERALITY_OPTIONS: LateralityDef[] = [
  { id: 'bilateral',    labelEn: 'Both sides',    labelHe: 'דו-צדדי' },
  { id: 'left',         labelEn: 'Left side',     labelHe: 'צד שמאל' },
  { id: 'right',        labelEn: 'Right side',    labelHe: 'צד ימין' },
  { id: 'notApplicable',labelEn: 'Not applicable',labelHe: 'לא רלוונטי' },
];

interface HeadacheLocationPickerProps {
  value: LocationSelection | undefined;
  onChange: (val: LocationSelection) => void;
  disabled?: boolean;
}

export default function HeadacheLocationPicker({ value, onChange, disabled }: HeadacheLocationPickerProps) {
  const { i18n } = useTranslation();
  const isHe = i18n.language === 'he';
  const selected = (value?.regionIds ?? []) as HeadRegionId[];
  const laterality = value?.laterality;

  const toggleRegion = (id: HeadRegionId) => {
    if (disabled) return;
    let next: HeadRegionId[];
    if (id === 'diffuse') {
      // Selecting "diffuse" clears specific regions
      next = selected.includes('diffuse') ? [] : ['diffuse'];
    } else {
      // Selecting a specific region clears "diffuse" if active
      const withoutDiffuse = selected.filter(r => r !== 'diffuse');
      next = withoutDiffuse.includes(id)
        ? withoutDiffuse.filter(r => r !== id)
        : [...withoutDiffuse, id];
    }
    onChange({ regionIds: next, laterality });
  };

  const setLaterality = (lat: Laterality) => {
    if (disabled) return;
    onChange({ regionIds: selected, laterality: lat });
  };

  const showLaterality = selected.length > 0 && !selected.includes('diffuse');

  return (
    <div className="space-y-4">
      {/* Region selector — segmented-button style */}
      <div
        className="flex flex-wrap gap-2"
        aria-label={isHe ? 'בורר מיקום כאב ראש' : 'Headache location picker'}
      >
        {HEAD_REGIONS.map(region => {
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
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-indigo-500 border-indigo-600 text-white shadow-sm'
                  : disabled
                    ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                }
              `}
            >
              <span aria-hidden>{region.emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Laterality toggle — only shown for specific regions */}
      {showLaterality && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {isHe ? 'צד הכאב' : 'Side of the pain'}
          </p>
          <div className="flex flex-wrap gap-2">
            {LATERALITY_OPTIONS.map(opt => {
              const isActive = laterality === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setLaterality(opt.id)}
                  aria-pressed={isActive}
                  className={`
                    px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                      : disabled
                        ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 cursor-pointer'
                    }
                  `}
                >
                  {isHe ? opt.labelHe : opt.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
          <span className="font-semibold">
            {isHe ? 'נבחר: ' : 'Selected: '}
          </span>
          {selected.map(id => {
            const r = HEAD_REGIONS.find(h => h.id === id);
            return r ? (isHe ? r.labelHe : r.labelEn) : id;
          }).join(', ')}
          {laterality && laterality !== 'notApplicable' && (
            <span className="ml-2 text-indigo-500">
              ({LATERALITY_OPTIONS.find(o => o.id === laterality)?.[isHe ? 'labelHe' : 'labelEn']})
            </span>
          )}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-gray-400 text-center">
          {isHe ? 'בחר את מיקום כאב הראש' : 'Select where the headache is located'}
        </p>
      )}
    </div>
  );
}

import type { WizardState, WizardAction, ApplianceCategory } from '../types';
import pricesData from '../data/prices.json';
import { Card } from './ui/Card';

interface CategorySelectorProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const categories = Object.entries(pricesData.categories) as [
  ApplianceCategory,
  { name: string; icon: string },
][];

export function CategorySelector({ dispatch }: CategorySelectorProps) {
  const handleSelect = (category: ApplianceCategory) => {
    dispatch({ type: 'SELECT_CATEGORY', payload: category });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">选择家电品类</h1>
      <p className="text-slate-500 mb-6">请选择需要维修的家电类型</p>

      <div className="grid grid-cols-2 gap-3">
        {categories.map(([key, data]) => (
          <Card
            key={key}
            onClick={() => handleSelect(key)}
            className={`cursor-pointer hover:shadow-md active:scale-[0.98] ${
              key === 'other' ? 'border-dashed' : ''
            }`}
          >
            <div className="flex flex-col items-center gap-2 py-3">
              <span className="text-4xl">{data.icon}</span>
              <span className="text-base font-medium text-slate-700">{data.name}</span>
              {key === 'other' && (
                <span className="text-xs text-slate-400">其他家电</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { WizardState, WizardAction, SelectedItem } from '../types';
import pricesData from '../data/prices.json';
import { Tag } from './ui/Tag';
import { Button } from './ui/Button';

interface RepairItemSelectorProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export function RepairItemSelector({ state, dispatch }: RepairItemSelectorProps) {
  const [customInput, setCustomInput] = useState('');

  const categoryData = state.category
    ? pricesData.categories[state.category]
    : null;

  const isOtherCategory = state.category === 'other';

  const toggleItem = (item: SelectedItem) => {
    const exists = state.selectedItems.find((i) => i.id === item.id);
    if (exists) {
      dispatch({
        type: 'SET_ITEMS',
        payload: state.selectedItems.filter((i) => i.id !== item.id),
      });
    } else {
      dispatch({
        type: 'SET_ITEMS',
        payload: [...state.selectedItems, item],
      });
    }
  };

  const addCustomItem = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const id = `custom_${Date.now()}`;
    toggleItem({ id, name: trimmed, isCustom: true });
    setCustomInput('');
  };

  const removeCustomItem = (id: string) => {
    dispatch({
      type: 'SET_ITEMS',
      payload: state.selectedItems.filter((i) => i.id !== id),
    });
  };

  const canProceed = state.selectedItems.length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    dispatch({ type: 'GO_TO_STEP', payload: 4 });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">选择维修项目</h1>
      <p className="text-slate-500 mb-6">
        {isOtherCategory
          ? '请描述您需要维修的项目'
          : '选择维修师傅诊断的故障项目，可多选'}
      </p>

      {/* Preset repair items */}
      {!isOtherCategory && categoryData && categoryData.repair_items.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          {categoryData.repair_items.map((item) => {
            const isSelected = state.selectedItems.some((i) => i.id === item.id);
            return (
              <Tag
                key={item.id}
                selected={isSelected}
                variant="preset"
                onClick={() => toggleItem({ id: item.id, name: item.name, isCustom: false })}
              >
                {item.name}
              </Tag>
            );
          })}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={isOtherCategory ? '输入故障或维修项目...' : '其他故障，请描述...'}
          className="flex-1 h-12 px-4 text-base rounded-xl border border-slate-300 bg-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                     placeholder:text-slate-400 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomItem();
            }
          }}
        />
        <Button variant="secondary" onClick={addCustomItem} disabled={!customInput.trim()}>
          添加
        </Button>
      </div>

      {/* Show custom items as removable tags */}
      {state.selectedItems.filter((i) => i.isCustom).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {state.selectedItems
            .filter((i) => i.isCustom)
            .map((item) => (
              <Tag
                key={item.id}
                selected={true}
                variant="custom"
                onRemove={() => removeCustomItem(item.id)}
              >
                {item.name}
              </Tag>
            ))}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canProceed}
        onClick={handleNext}
      >
        下一步
      </Button>
    </div>
  );
}

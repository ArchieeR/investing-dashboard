import { useState, useEffect, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';
import type { BudgetLimit } from '../state/types';

const containerStyle: CSSProperties = {
  marginTop: '2rem',
  padding: '1.5rem',
  backgroundColor: '#fff',
  borderRadius: '0.75rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const headerStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '1rem',
  color: '#1f2937',
};

const descriptionStyle: CSSProperties = {
  margin: '0 0 1.5rem 0',
  color: '#6b7280',
  fontSize: '0.875rem',
};

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  marginBottom: '1.5rem',
  padding: '0.25rem',
  backgroundColor: '#f1f5f9',
  borderRadius: '0.5rem',
  border: '1px solid #e2e8f0',
};

const tabStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.25rem',
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
};

const activeTabStyle: CSSProperties = {
  ...tabStyle,
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const listItemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr 100px 80px 80px 120px 100px auto',
  gap: '1rem',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#f9fafb',
  borderRadius: '0.5rem',
  border: '1px solid #e5e7eb',
  transition: 'all 0.2s ease',
};

const draggingItemStyle: CSSProperties = {
  ...listItemStyle,
  backgroundColor: '#eff6ff',
  border: '1px solid #3b82f6',
  opacity: 0.8,
};

const dragHandleStyle: CSSProperties = {
  cursor: 'grab',
  color: '#9ca3af',
  fontSize: '1rem',
  padding: '0.25rem',
  userSelect: 'none',
};

const addFormStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#fff',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  marginBottom: '1rem',
};

const allocationHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
};

const allocationLabelStyle: CSSProperties = {
  fontWeight: 600,
  color: '#374151',
};

const allocationCurrentStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
};

const inputRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};

const inputStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #dadce0',
  borderRadius: '8px',
  fontSize: '14px',
  width: '80px',
  textAlign: 'right',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const selectStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #dadce0',
  borderRadius: '8px',
  fontSize: '14px',
  width: '120px',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const nameInputStyle: CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  border: '1px solid #dadce0',
  borderRadius: '8px',
  fontSize: '14px',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const buttonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const addButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1a73e8',
  color: '#fff',
};

const deleteButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ea4335',
  color: '#fff',
};

const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  minWidth: '60px',
};

const progressBarStyle: CSSProperties = {
  width: '100%',
  height: '6px',
  backgroundColor: '#e5e7eb',
  borderRadius: '3px',
  marginTop: '0.5rem',
  overflow: 'hidden',
};

const progressFillStyle = (percentage: number, isOverTarget: boolean): CSSProperties => ({
  height: '100%',
  backgroundColor: isOverTarget ? '#ef4444' : percentage > 90 ? '#f59e0b' : '#10b981',
  width: `${Math.min(percentage, 100)}%`,
  transition: 'all 0.3s ease',
});

type AllocationTab = 'sections' | 'themes' | 'accounts';

const formatCurrency = (value: number): string => `£${value.toFixed(2)}`;

export const AllocationManager = () => {
  const { portfolio, totalValue, targetPortfolioValue, setBudget, budgets, remaining, addListItem, removeListItem, setThemeSection, reorderList } = usePortfolio();
  const [activeTab, setActiveTab] = useState<AllocationTab>('sections');
  const [drafts, setDrafts] = useState<Record<string, { amount: string; percent: string }>>({});
  const [newItemName, setNewItemName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Drag and drop state
  const [dragState, setDragState] = useState<{ type: AllocationTab; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ type: AllocationTab; index: number } | null>(null);

  const hasFilters = false; // You can add filter logic here if needed

  useEffect(() => {
    // Initialize drafts from current budgets, but preserve existing drafts for other tabs
    setDrafts(prevDrafts => {
      const newDrafts = { ...prevDrafts };
      
      remaining[activeTab].forEach((entry) => {
        const key = `${activeTab}:${entry.label}`;
        if (activeTab === 'themes') {
          // For themes, show section percentage in the percent field
          newDrafts[key] = {
            amount: entry.amountLimit !== undefined ? String(entry.amountLimit) : '',
            percent: entry.sectionPercentLimit !== undefined ? String(entry.sectionPercentLimit) : '',
          };
        } else {
          newDrafts[key] = {
            amount: entry.amountLimit !== undefined ? String(entry.amountLimit) : '',
            percent: entry.percentLimit !== undefined ? String(entry.percentLimit) : '',
          };
        }
      });
      
      return newDrafts;
    });
  }, [remaining, activeTab]);

  const updateDraft = (key: string, field: 'amount' | 'percent', value: string) => {
    setDrafts(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const commitBudget = (label: string, field: 'amount' | 'percent', value: string, domain?: AllocationTab) => {
    const targetDomain = domain || activeTab;
    const numValue = value.trim() === '' ? undefined : Number.parseFloat(value);
    if (numValue !== undefined && !Number.isFinite(numValue)) {
      return;
    }

    // Clear the draft for the field we're not setting
    const key = `${targetDomain}:${label}`;
    if (field === 'amount') {
      updateDraft(key, 'percent', '');
    } else {
      updateDraft(key, 'amount', '');
    }

    const existingBudget = budgets[targetDomain]?.[label] ?? {};
    let newBudget: BudgetLimit = {};

    if (targetDomain === 'themes') {
      // For themes, only store the percentage of section
      // The selector will calculate amount and portfolio percent dynamically
      if (field === 'percent') {
        newBudget.percentOfSection = numValue;
        // Don't store amount or percent - let the selector calculate them dynamically
      } else {
        // If setting amount directly for theme
        newBudget.amount = numValue;
        if (numValue !== undefined && targetPortfolioValue > 0) {
          newBudget.percent = (numValue / targetPortfolioValue) * 100;
          // Calculate section percentage
          const section = portfolio.lists.themeSections?.[label];
          if (section) {
            const sectionBudget = budgets.sections?.[section];
            if (sectionBudget?.amount && sectionBudget.amount > 0) {
              newBudget.percentOfSection = (numValue / sectionBudget.amount) * 100;
            } else if (sectionBudget?.percent && sectionBudget.percent > 0) {
              newBudget.percentOfSection = (newBudget.percent / sectionBudget.percent) * 100;
            }
          }
        }
      }
    } else {
      // For sections and accounts, work with target portfolio
      if (field === 'amount') {
        newBudget.amount = numValue;
        if (numValue !== undefined && targetPortfolioValue > 0) {
          newBudget.percent = (numValue / targetPortfolioValue) * 100;
        }
      } else {
        newBudget.percent = numValue;
        if (numValue !== undefined && targetPortfolioValue > 0) {
          newBudget.amount = (numValue / 100) * targetPortfolioValue;
        }
      }
    }

    if (newBudget.amount === undefined && newBudget.percent === undefined && newBudget.percentOfSection === undefined) {
      setBudget(targetDomain, label, undefined);
    } else {
      setBudget(targetDomain, label, newBudget);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'sections':
        return remaining.sections;
      case 'themes':
        return remaining.themes;
      case 'accounts':
        return remaining.accounts;
      default:
        return [];
    }
  };

  const getTabLabel = (tab: AllocationTab): string => {
    switch (tab) {
      case 'sections': return 'Sections';
      case 'themes': return 'Themes';
      case 'accounts': return 'Accounts';
    }
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addListItem(activeTab, newItemName.trim());
      setNewItemName('');
    }
  };

  const handleDeleteItem = (itemName: string, itemType?: 'sections' | 'themes' | 'accounts') => {
    const targetType = itemType || activeTab;
    console.log(`🗑️ Attempting to delete ${targetType}: "${itemName}"`);
    
    // Get the appropriate list for the target type
    let currentList;
    if (targetType === 'sections') {
      currentList = remaining.sections;
    } else if (targetType === 'themes') {
      currentList = remaining.themes;
    } else if (targetType === 'accounts') {
      currentList = remaining.accounts;
    } else {
      currentList = getCurrentData();
    }
    
    // Check if this is the last item
    if (currentList.length <= 1) {
      alert(`Cannot delete the last ${targetType.slice(0, -1)}. You must have at least one.`);
      return;
    }
    
    if (window.confirm(`Delete "${itemName}"? This will update all holdings using this ${targetType.slice(0, -1)}.`)) {
      console.log(`🗑️ Confirmed deletion of ${targetType}: "${itemName}"`);
      removeListItem(targetType, itemName);
    } else {
      console.log(`🗑️ Deletion cancelled for ${targetType}: "${itemName}"`);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    console.log(`🔥 Drag start: ${activeTab} at index ${index}`);
    setDragState({ type: activeTab, index });
    setDragOver({ type: activeTab, index });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${activeTab}:${index}`);
    }
  };

  const handleDragOver = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dragState || dragState.type !== activeTab) {
      return;
    }
    console.log(`🔄 Drag over: ${activeTab} index ${index}`);
    setDragOver({ type: activeTab, index });
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log(`🎯 Drop: ${activeTab} from ${dragState?.index} to ${index}`);
    if (!dragState || dragState.type !== activeTab) {
      console.log('Drop cancelled: invalid drag state');
      return;
    }

    if (dragState.index !== index) {
      console.log(`Calling reorderList(${activeTab}, ${dragState.index}, ${index})`);
      reorderList(activeTab, dragState.index, index);
    }
    setDragState(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    console.log('Drag end');
    setDragState(null);
    setDragOver(null);
  };

  const currentData = getCurrentData();
  const totalTarget = currentData.reduce((sum, item) => sum + (item.percentLimit || 0), 0);

  // Helper functions
  const getSectionColor = (sectionName: string) => {
    const sectionColors: Record<string, string> = {
      'Core': '#3b82f6',
      'Satellite': '#10b981', 
      'Cash': '#6b7280',
      'Speculative': '#ef4444',
      'Alternative': '#8b5cf6'
    };
    return sectionColors[sectionName] || '#94a3b8';
  };

  const getThemeColor = (index: number) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    return colors[index % colors.length];
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Allocation Guidelines</h2>
      <p style={descriptionStyle}>
        Set target allocations for your portfolio. Total value: {formatCurrency(totalValue)}
        {hasFilters ? ' (filters do not affect these calculations)' : ''}
      </p>
      
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#059669', fontWeight: 500 }}>Live Values</span>
            <span style={{ color: '#6b7280' }}>- Current market values based on live prices</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#7c3aed', fontWeight: 500 }}>Target Values</span>
            <span style={{ color: '#6b7280' }}>- Your planned allocation goals</span>
          </div>
        </div>
      </div>

      <div style={tabsStyle}>
        {(['portfolio', 'accounts'] as ('portfolio' | 'accounts')[]).map((tab) => (
          <button
            key={tab}
            style={activeTab === tab || (tab === 'portfolio' && (activeTab === 'sections' || activeTab === 'themes')) ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab(tab === 'portfolio' ? 'sections' : tab)}
          >
            {tab === 'portfolio' ? 'Portfolio Structure' : 'Accounts'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: totalTarget > 100 ? '#dc2626' : '#6b7280' }}>
        Total target: {totalTarget.toFixed(1)}% {totalTarget > 100 && '(Over 100%!)'}
      </div>

      {/* Portfolio Structure View */}
      {(activeTab === 'sections' || activeTab === 'themes') && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Portfolio Structure
          </h3>
          
          {/* Add new section form */}
          <div style={addFormStyle}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add new section..."
              style={nameInputStyle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addListItem('sections', newItemName.trim());
                  setNewItemName('');
                }
              }}
            />
            <button 
              onClick={() => {
                if (newItemName.trim()) {
                  addListItem('sections', newItemName.trim());
                  setNewItemName('');
                }
              }} 
              style={addButtonStyle}
            >
              Add Section
            </button>
          </div>

          {/* Sections with expandable themes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {remaining.sections.map((section, sectionIndex) => {
              const isExpanded = expandedSections.has(section.label);
              const sectionThemes = remaining.themes.filter(theme => 
                portfolio.lists.themeSections?.[theme.label] === section.label
              );
              
              const toggleSection = () => {
                const newExpanded = new Set(expandedSections);
                if (isExpanded) {
                  newExpanded.delete(section.label);
                } else {
                  newExpanded.add(section.label);
                }
                setExpandedSections(newExpanded);
              };

              const isDragging = dragState?.type === 'sections' && dragState.index === sectionIndex;
              const isDragOver = dragOver?.type === 'sections' && dragOver.index === sectionIndex;

              return (
                <div key={section.label} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {/* Section Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto 1fr 100px 80px 80px 100px auto',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: isDragging ? '#eff6ff' : isDragOver ? '#f0f9ff' : '#f9fafb',
                    cursor: 'pointer',
                    opacity: isDragging ? 0.8 : 1,
                    border: isDragOver && !isDragging ? '2px solid #3b82f6' : 'none'
                  }}
                  onClick={toggleSection}
                  onDragOver={(e) => {
                    setActiveTab('sections');
                    handleDragOver(sectionIndex)(e as any);
                  }}
                  onDragEnter={(e) => {
                    handleDragEnter(sectionIndex)(e as any);
                  }}
                  onDrop={(e) => {
                    setActiveTab('sections');
                    handleDrop(sectionIndex)(e as any);
                  }}
                  >
                    {/* Expand/Collapse */}
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    
                    {/* Drag handle */}
                    <span 
                      style={{
                        ...dragHandleStyle,
                        cursor: 'grab'
                      }}
                      draggable={true}
                      onDragStart={(e) => {
                        console.log('🔥 Section drag start', sectionIndex);
                        setActiveTab('sections');
                        handleDragStart(sectionIndex)(e as any);
                      }}
                      onMouseDown={(e) => {
                        console.log('🖱️ Mouse down on SECTION drag handle');
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        console.log('🖱️ Click on SECTION drag handle');
                        e.stopPropagation();
                      }}
                      title="Drag to reorder sections"
                    >
                      ⋮⋮
                    </span>
                    
                    {/* Section name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: getSectionColor(section.label),
                        borderRadius: '3px'
                      }} />
                      <span style={{ fontWeight: 600, color: '#374151' }}>{section.label}</span>
                      {sectionThemes.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          ({sectionThemes.length} themes)
                        </span>
                      )}
                    </div>
                    
                    {/* Current allocation (Live Values) */}
                    <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                      <div style={{ 
                        color: '#059669', 
                        fontWeight: 500
                      }}>
                        {formatCurrency(section.used)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
                        {section.percentage.toFixed(1)}% (Live)
                      </div>
                    </div>
                    
                    {/* Target amount */}
                    <input
                      type="number"
                      step="0.01"
                      value={drafts[`sections:${section.label}`]?.amount || ''}
                      onChange={(e) => updateDraft(`sections:${section.label}`, 'amount', e.target.value)}
                      onBlur={(e) => commitBudget(section.label, 'amount', e.target.value)}
                      placeholder={(section.amountLimit || 0).toFixed(2)}
                      style={{
                        ...inputStyle,
                        borderColor: '#7c3aed',
                        backgroundColor: '#faf5ff'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Target Amount"
                    />
                    
                    {/* Target percentage */}
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={drafts[`sections:${section.label}`]?.percent || ''}
                      onChange={(e) => updateDraft(`sections:${section.label}`, 'percent', e.target.value)}
                      onBlur={(e) => commitBudget(section.label, 'percent', e.target.value)}
                      placeholder={(section.percentLimit || 0).toFixed(1)}
                      style={{
                        ...inputStyle,
                        borderColor: '#7c3aed',
                        backgroundColor: '#faf5ff'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Target Percentage"
                    />
                    
                    {/* Progress */}
                    <div style={{ width: '100px', textAlign: 'center' }}>
                      {section.percentLimit && section.percentLimit > 0 ? (
                        <div>
                          <div style={progressBarStyle}>
                            <div style={(() => {
                              // Calculate section target value
                              let sectionTargetValue = 0;
                              if (section.amountLimit) {
                                sectionTargetValue = section.amountLimit;
                              } else if (section.percentLimit && targetPortfolioValue > 0) {
                                sectionTargetValue = (section.percentLimit / 100) * targetPortfolioValue;
                              }
                              
                              // Calculate live total of section (sum of all themes in this section)
                              const themesInSection = remaining.themes.filter(theme => 
                                portfolio.lists.themeSections?.[theme.label] === section.label
                              );
                              const sectionLiveTotal = themesInSection.reduce((sum, theme) => sum + theme.used, 0);
                              
                              // Calculate progress: (Live Total / Target Value) * 100
                              const progressPercent = sectionTargetValue > 0 ? (sectionLiveTotal / sectionTargetValue) * 100 : 0;
                              const isOverTarget = progressPercent > 100;
                              
                              return progressFillStyle(progressPercent, isOverTarget);
                            })()} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {(() => {
                              // Calculate section target value
                              let sectionTargetValue = 0;
                              if (section.amountLimit) {
                                sectionTargetValue = section.amountLimit;
                              } else if (section.percentLimit && targetPortfolioValue > 0) {
                                sectionTargetValue = (section.percentLimit / 100) * targetPortfolioValue;
                              }
                              
                              // Calculate live total of section (sum of all themes in this section)
                              const themesInSection = remaining.themes.filter(theme => 
                                portfolio.lists.themeSections?.[theme.label] === section.label
                              );
                              const sectionLiveTotal = themesInSection.reduce((sum, theme) => sum + theme.used, 0);
                              
                              // Calculate progress: (Live Total / Target Value) * 100
                              const progressPercent = sectionTargetValue > 0 ? (sectionLiveTotal / sectionTargetValue) * 100 : 0;
                              
                              return progressPercent.toFixed(0);
                            })()}%
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          No target
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(section.label, 'sections');
                      }}
                      style={deleteButtonStyle}
                      disabled={section.label === 'Cash'}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Themes within section */}
                  {isExpanded && (
                    <div style={{ backgroundColor: '#fff' }}>
                      {/* Add theme form */}
                      <div style={{
                        ...addFormStyle,
                        margin: '1rem',
                        backgroundColor: '#f8fafc'
                      }}>
                        <input
                          type="text"
                          placeholder="Add theme to this section..."
                          style={nameInputStyle}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const themeName = e.currentTarget.value.trim();
                              addListItem('themes', themeName, section.label);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button 
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input.value.trim()) {
                              const themeName = input.value.trim();
                              addListItem('themes', themeName, section.label);
                              input.value = '';
                            }
                          }}
                          style={addButtonStyle}
                        >
                          Add Theme
                        </button>
                      </div>

                      {/* Theme list */}
                      {sectionThemes.map((theme, themeIndex) => {
                        const globalThemeIndex = remaining.themes.findIndex(t => t.label === theme.label);
                        const isThemeDragging = dragState?.type === 'themes' && dragState.index === globalThemeIndex;
                        const isThemeDragOver = dragOver?.type === 'themes' && dragOver.index === globalThemeIndex;
                        
                        return (
                        <div key={theme.label} style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto auto 1fr 100px 80px 80px 100px auto',
                          gap: '1rem',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          borderTop: '1px solid #f3f4f6',
                          marginLeft: '2rem',
                          backgroundColor: isThemeDragging ? '#eff6ff' : isThemeDragOver ? '#f0f9ff' : '#ffffff',
                          opacity: isThemeDragging ? 0.8 : 1,
                          border: isThemeDragOver && !isThemeDragging ? '2px solid #3b82f6' : 'none'
                        }}
                        onDragOver={(e) => {
                          const globalThemeIndex = remaining.themes.findIndex(t => t.label === theme.label);
                          setActiveTab('themes');
                          handleDragOver(globalThemeIndex)(e as any);
                        }}
                        onDragEnter={(e) => {
                          const globalThemeIndex = remaining.themes.findIndex(t => t.label === theme.label);
                          handleDragEnter(globalThemeIndex)(e as any);
                        }}
                        onDrop={(e) => {
                          const globalThemeIndex = remaining.themes.findIndex(t => t.label === theme.label);
                          setActiveTab('themes');
                          handleDrop(globalThemeIndex)(e as any);
                        }}
                        >
                          <span></span>
                          <span 
                            style={{
                              ...dragHandleStyle,
                              cursor: 'grab'
                            }}
                            draggable={true}
                            onDragStart={(e) => {
                              console.log('🔥 Theme drag start');
                              // Find the global theme index
                              const globalThemeIndex = remaining.themes.findIndex(t => t.label === theme.label);
                              console.log('Theme:', theme.label, 'Local index:', themeIndex, 'Global index:', globalThemeIndex);
                              setActiveTab('themes');
                              handleDragStart(globalThemeIndex)(e as any);
                            }}
                            onDragEnd={handleDragEnd}
                            onMouseDown={(e) => {
                              console.log('🖱️ Mouse down on THEME drag handle');
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              console.log('🖱️ Click on THEME drag handle');
                              e.stopPropagation();
                            }}
                            title="Drag to reorder themes"
                          >
                            ⋮⋮
                          </span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: getThemeColor(themeIndex),
                              borderRadius: '2px'
                            }} />
                            <span style={{ color: '#374151' }}>{theme.label}</span>
                          </div>
                          
                          <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                            <div style={{ 
                              color: '#059669', 
                              fontWeight: 500
                            }}>
                              {formatCurrency(theme.used)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
                              {theme.percentage.toFixed(1)}% (Live)
                            </div>
                          </div>
                          
                          {/* Target Value */}
                          <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                            {(() => {
                              const sectionBudget = budgets.sections?.[section.label];
                              const themeTargetPercent = theme.sectionPercentLimit || 0;
                              
                              // Calculate section target value (amount or percentage of portfolio)
                              let sectionTargetValue = 0;
                              if (sectionBudget?.amount) {
                                sectionTargetValue = sectionBudget.amount;
                              } else if (sectionBudget?.percent && targetPortfolioValue > 0) {
                                sectionTargetValue = (sectionBudget.percent / 100) * targetPortfolioValue;
                              }
                              
                              // Calculate theme target value as percentage of section target
                              const themeTargetValue = sectionTargetValue > 0 && themeTargetPercent > 0 
                                ? (themeTargetPercent / 100) * sectionTargetValue 
                                : 0;
                              
                              return (
                                <div style={{ 
                                  color: themeTargetValue > 0 ? '#7c3aed' : '#9ca3af',
                                  fontWeight: themeTargetValue > 0 ? 500 : 400
                                }}>
                                  {themeTargetValue > 0 ? formatCurrency(themeTargetValue) : '—'}
                                </div>
                              );
                            })()}
                          </div>
                          
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={drafts[`themes:${theme.label}`]?.percent || (theme.sectionPercentLimit ? theme.sectionPercentLimit.toFixed(1) : '')}
                            onChange={(e) => updateDraft(`themes:${theme.label}`, 'percent', e.target.value)}
                            onBlur={(e) => commitBudget(theme.label, 'percent', e.target.value, 'themes')}
                            placeholder={(theme.sectionPercentLimit || 0).toFixed(1)}
                            style={{
                              ...inputStyle,
                              borderColor: '#7c3aed',
                              backgroundColor: '#faf5ff'
                            }}
                            title="Target % of Section"
                          />
                          
                          <div style={{ width: '100px', textAlign: 'center' }}>
                            {(() => {
                              const sectionBudget = budgets.sections?.[section.label];
                              const themeTargetPercent = theme.sectionPercentLimit || 0;
                              
                              // Calculate section target value (amount or percentage of portfolio)
                              let sectionTargetValue = 0;
                              if (sectionBudget?.amount) {
                                sectionTargetValue = sectionBudget.amount;
                              } else if (sectionBudget?.percent && targetPortfolioValue > 0) {
                                sectionTargetValue = (sectionBudget.percent / 100) * targetPortfolioValue;
                              }
                              
                              // Calculate theme target value as percentage of section target
                              const themeTargetValue = sectionTargetValue > 0 && themeTargetPercent > 0 
                                ? (themeTargetPercent / 100) * sectionTargetValue 
                                : 0;
                              
                              if (themeTargetValue > 0) {
                                const progressPercent = (theme.used / themeTargetValue) * 100;
                                const isOverTarget = theme.used > themeTargetValue;
                                
                                return (
                                  <div>
                                    <div style={progressBarStyle}>
                                      <div style={progressFillStyle(progressPercent, isOverTarget)} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                      {progressPercent.toFixed(0)}%
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                    No target
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          
                          <button
                            onClick={() => handleDeleteItem(theme.label, 'themes')}
                            style={deleteButtonStyle}
                          >
                            Delete
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section Progress Bars */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
              Section Allocation Overview
            </h3>
          {portfolio.lists.sections.map((sectionName) => {
            const sectionBudget = budgets.sections?.[sectionName];
            const sectionTargetPercent = sectionBudget?.percent || 0;
            
            // Get all themes in this section
            const themesInSection = remaining.themes.filter(theme => 
              portfolio.lists.themeSections?.[theme.label] === sectionName
            );
            
            // Calculate total theme allocation in this section (fixed percentages)
            const totalThemeAllocation = themesInSection.reduce((sum, theme) => 
              sum + (theme.sectionPercentLimit || 0), 0
            );
            
            const remainingPercent = Math.max(0, 100 - totalThemeAllocation);
            const isOverAllocated = totalThemeAllocation > 100;
            
            if (sectionTargetPercent === 0 && themesInSection.length === 0) {
              return null; // Don't show sections with no target and no themes
            }
            
            return (
              <div key={sectionName} style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: getSectionColor(sectionName),
                      borderRadius: '3px'
                    }} />
                    <span style={{ fontWeight: 500, color: '#374151' }}>{sectionName}</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: isOverAllocated ? '#dc2626' : '#6b7280' 
                  }}>
                    {totalThemeAllocation.toFixed(1)}% allocated
                    {totalThemeAllocation < 100 && (
                      <span style={{ color: '#059669', marginLeft: '0.5rem' }}>
                        ({(100 - totalThemeAllocation).toFixed(1)}% unallocated)
                      </span>
                    )}
                    {totalThemeAllocation > 100 && (
                      <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
                        ({(totalThemeAllocation - 100).toFixed(1)}% over-allocated!)
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Progress bar with exact percentages */}
                <div style={{
                  display: 'flex',
                  height: '24px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  position: 'relative'
                }}>
                  {/* Theme bars with exact percentages */}
                  {themesInSection.map((theme, index) => {
                    const themePercent = theme.sectionPercentLimit || 0;
                    const isOverTarget = themePercent > sectionTargetPercent;
                    
                    return (
                      <div
                        key={theme.label}
                        style={{
                          width: `${themePercent}%`,
                          backgroundColor: getThemeColor(index),
                          opacity: isOverTarget ? 0.4 : 1,
                          borderRight: index < themesInSection.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                          position: 'relative',
                          minWidth: themePercent > 0 ? '2px' : '0px' // Ensure small allocations are visible
                        }}
                        title={`${theme.label}: ${themePercent.toFixed(1)}%`}
                      />
                    );
                  })}
                  
                  {/* Target boundary line */}
                  {sectionTargetPercent > 0 && sectionTargetPercent < 100 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${sectionTargetPercent}%`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        backgroundColor: '#374151',
                        zIndex: 10
                      }}
                      title={`Target: ${sectionTargetPercent.toFixed(1)}%`}
                    />
                  )}
                  
                  {/* Percentage markers */}
                  {[25, 50, 75].map(percent => (
                    <div
                      key={percent}
                      style={{
                        position: 'absolute',
                        left: `${percent}%`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        backgroundColor: 'rgba(107, 114, 128, 0.3)',
                        zIndex: 5
                      }}
                      title={`${percent}%`}
                    />
                  ))}
                </div>
                
                {/* Theme legend */}
                {themesInSection.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem', 
                    marginTop: '0.5rem' 
                  }}>
                    {themesInSection.map((theme, index) => (
                      <div key={theme.label} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: getThemeColor(index),
                          borderRadius: '2px'
                        }} />
                        <span>{theme.label} ({(theme.sectionPercentLimit || 0).toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Accounts View */}
      {activeTab === 'accounts' && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Account Totals
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Account allocations are automatically calculated based on holdings assigned in the Holdings table.
          </p>
          
          {/* Add new account form */}
          <div style={addFormStyle}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add new account..."
              style={nameInputStyle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
            <button onClick={handleAddItem} style={addButtonStyle}>
              Add Account
            </button>
          </div>

          {/* Header row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 120px 100px auto',
            gap: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span style={{ textAlign: 'left' }}>Account Name</span>
            <span style={{ textAlign: 'right', color: '#059669' }}>Live Value</span>
            <span style={{ textAlign: 'right', color: '#059669' }}>% of Portfolio</span>
            <span style={{ textAlign: 'center' }}>Actions</span>
          </div>

          {/* Account list */}
          <div style={listStyle}>
            {remaining.accounts.map((item) => (
              <div 
                key={item.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 100px auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ fontWeight: 600, color: '#374151' }}>
                  {item.label}
                </div>
                
                <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  <div style={{ 
                    color: '#059669', 
                    fontWeight: 500
                  }}>
                    {formatCurrency(item.used)}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  <div style={{ 
                    color: '#059669', 
                    fontWeight: 500
                  }}>
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteItem(item.label, 'accounts')}
                  style={deleteButtonStyle}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};
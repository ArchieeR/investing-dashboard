import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { usePortfolio } from '../state/portfolioStore';
import type { BudgetRemaining } from '../state/selectors';
import type { BudgetLimit } from '../state/types';

type DomainKey = 'sections' | 'themes' | 'accounts';
const CASH_SECTION = 'Cash';

const panelStyle: CSSProperties = {
  marginTop: '2rem',
};

const headerStyle: CSSProperties = {
  marginBottom: '1rem',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.9rem',
};

const cardsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.25rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  alignItems: 'start',
};

const cardStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid #e8eaed',
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '0.75rem',
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  fontWeight: 600,
  color: '#0f172a',
};

const cardHintStyle: CSSProperties = {
  margin: '0.35rem 0 0',
  fontSize: '0.8rem',
  color: '#64748b',
};

const addRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '0.5rem',
};

const textInputStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  width: '100%',
  fontSize: '14px',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const numberInputStyle: CSSProperties = {
  width: '4rem',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  fontSize: '14px',
  textAlign: 'right',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const selectStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  fontSize: '14px',
  minWidth: '4.8rem',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const primaryButtonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: '#1a73e8',
  color: '#fff',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.15s ease',
};

const secondaryButtonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  background: '#fff',
  color: '#5f6368',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(150px, 1fr) repeat(2, auto) auto auto',
  gap: '0.6rem',
  alignItems: 'center',
  padding: '0.55rem 0',
  borderBottom: '1px solid #e2e8f0',
};

const dragHandleStyle: CSSProperties = {
  cursor: 'grab',
  userSelect: 'none',
  fontSize: '1.1rem',
  color: '#94a3b8',
};

const dropZoneStyle: CSSProperties = {
  padding: '0.5rem',
  marginTop: '-0.5rem',
  borderRadius: '0.5rem',
  border: '1px dashed #cbd5f5',
  color: '#64748b',
  fontSize: '0.8rem',
  textAlign: 'center',
};

const formatCurrency = (value: number): string => `£${value.toFixed(2)}`;

const parseNumber = (value: string): number | undefined => {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildEntryMap = (entries: BudgetRemaining[]) =>
  new Map(entries.map((entry) => [entry.label, entry]));

const abbreviateSection = (section: string): string => {
  if (!section) {
    return '';
  }
  if (section.length <= 3) {
    return section;
  }
  return section
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const InsightsPanel = () => {
  const {
    portfolio,
    derivedHoldings,
    budgets,
    setBudget,
    setThemeSection,
    addListItem,
    renameListItem,
    removeListItem,
    reorderList,
    totalValue,
    filters,
    remaining,
  } = usePortfolio();

  const hasFilters = Boolean(filters.section || filters.theme || filters.account);

  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, { amount: string; percent: string }>>({});
  const [listDrafts, setListDrafts] = useState({ sections: '', themes: '', accounts: '' });
  const [dragState, setDragState] = useState<{ domain: DomainKey; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ domain: DomainKey; index: number } | null>(null);

  const getDraftNumber = (domain: DomainKey, label: string, field: 'amount' | 'percent'): number | undefined => {
    const draft = budgetDrafts[`${domain}:${label}`];
    return draft ? parseNumber(draft[field]) : undefined;
  };

  const getSectionAmount = (section: string): number | undefined => {
    const draftAmount = getDraftNumber('sections', section, 'amount');
    if (draftAmount !== undefined) {
      return draftAmount;
    }
    const draftPercent = getDraftNumber('sections', section, 'percent');
    if (draftPercent !== undefined && totalValue > 0) {
      return (draftPercent / 100) * totalValue;
    }

    const limit = budgets.sections[section];
    if (limit?.amount !== undefined) {
      return limit.amount;
    }

    if (limit?.percent !== undefined && totalValue > 0) {
      return (limit.percent / 100) * totalValue;
    }

    return undefined;
  };

  const getSectionPercent = (section: string): number | undefined => {
    const draftPercent = getDraftNumber('sections', section, 'percent');
    if (draftPercent !== undefined) {
      return draftPercent;
    }

    const limit = budgets.sections[section];
    if (limit?.percent !== undefined) {
      return limit.percent;
    }

    const amount = getSectionAmount(section);
    if (amount !== undefined && totalValue > 0) {
      return (amount / totalValue) * 100;
    }

    return undefined;
  };

  const getAccountAmount = (account: string): number | undefined => {
    const draftAmount = getDraftNumber('accounts', account, 'amount');
    if (draftAmount !== undefined) {
      return draftAmount;
    }
    const draftPercent = getDraftNumber('accounts', account, 'percent');
    if (draftPercent !== undefined && totalValue > 0) {
      return (draftPercent / 100) * totalValue;
    }

    const limit = budgets.accounts[account];
    if (limit?.amount !== undefined) {
      return limit.amount;
    }

    if (limit?.percent !== undefined && totalValue > 0) {
      return (limit.percent / 100) * totalValue;
    }

    return undefined;
  };

  const getThemePercentOfSection = (theme: string): number | undefined => {
    const draftPercent = getDraftNumber('themes', theme, 'percent');
    if (draftPercent !== undefined) {
      return draftPercent;
    }

    const limit = budgets.themes[theme];
    return limit?.percentOfSection;
  };

  const getThemeAmount = (theme: string): number | undefined => {
    const section = portfolio.lists.themeSections?.[theme];
    const percentOfSection = getThemePercentOfSection(theme);
    if (section && percentOfSection !== undefined) {
      const sectionAmount = getSectionAmount(section);
      if (sectionAmount !== undefined) {
        return (percentOfSection / 100) * sectionAmount;
      }
      const sectionPercent = getSectionPercent(section);
      if (sectionPercent !== undefined && totalValue > 0) {
        const portfolioPercent = (sectionPercent * percentOfSection) / 100;
        return (portfolioPercent / 100) * totalValue;
      }
    }

    const limit = budgets.themes[theme];
    if (limit?.amount !== undefined) {
      return limit.amount;
    }

    if (limit?.percent !== undefined && totalValue > 0) {
      return (limit.percent / 100) * totalValue;
    }

    return undefined;
  };

  const getThemePortfolioPercent = (theme: string): number | undefined => {
    const section = portfolio.lists.themeSections?.[theme];
    const percentOfSection = getThemePercentOfSection(theme);
    if (section && percentOfSection !== undefined) {
      const sectionPercent = getSectionPercent(section);
      if (sectionPercent !== undefined) {
        return (sectionPercent * percentOfSection) / 100;
      }
    }

    const amount = getThemeAmount(theme);
    if (amount !== undefined && totalValue > 0) {
      return (amount / totalValue) * 100;
    }

    const limit = budgets.themes[theme];
    return limit?.percent;
  };

  const sectionRemainder = useMemo(() => {
    const nonCashSections = portfolio.lists.sections.filter((section) => section !== CASH_SECTION);
    const allocated = nonCashSections.reduce((sum, section) => sum + (getSectionAmount(section) ?? 0), 0);
    const amount = Math.max(totalValue - allocated, 0);
    const percent = totalValue > 0 ? (amount / totalValue) * 100 : 0;
    return { amount, percent };
  }, [portfolio.lists.sections, totalValue, budgets.sections, budgetDrafts]);

  const computeAccountRemainder = (account: string) => {
    const others = portfolio.lists.accounts.filter((label) => label !== account);
    const allocated = others.reduce((sum, label) => sum + (getAccountAmount(label) ?? 0), 0);
    const amount = Math.max(totalValue - allocated, 0);
    const percent = totalValue > 0 ? (amount / totalValue) * 100 : 0;
    return { amount, percent };
  };

  useEffect(() => {
    const next: Record<string, { amount: string; percent: string }> = {};
    const mapDomain = (domain: DomainKey) => {
      remaining[domain].forEach((entry) => {
        const key = `${domain}:${entry.label}`;
        if (domain === 'themes') {
          next[key] = {
            amount: entry.amountLimit !== undefined ? String(entry.amountLimit) : '',
            percent:
              entry.sectionPercentLimit !== undefined ? String(entry.sectionPercentLimit) : '',
          };
        } else {
          next[key] = {
            amount: entry.amountLimit !== undefined ? String(entry.amountLimit) : '',
            percent: entry.percentLimit !== undefined ? String(entry.percentLimit) : '',
          };
        }
      });
    };

    mapDomain('sections');
    mapDomain('accounts');
    mapDomain('themes');
    setBudgetDrafts(next);
  }, [remaining]);

  const cashRemaining = useMemo(() => {
    const locked = portfolio.settings.lockedTotal;
    const nonCash = derivedHoldings.reduce((sum, entry) => {
      if (!entry.holding.include || entry.holding.assetType === 'Cash') {
        return sum;
      }
      return sum + entry.value;
    }, 0);

    if (locked !== undefined) {
      return Math.max(locked - nonCash, 0);
    }

    const cashHoldings = derivedHoldings.reduce((sum, entry) => {
      if (!entry.holding.include || entry.holding.assetType !== 'Cash') {
        return sum;
      }
      return sum + entry.value;
    }, 0);

    return cashHoldings;
  }, [derivedHoldings, portfolio.settings.lockedTotal]);

  const totalSectionTarget = useMemo(
    () =>
      remaining.sections.reduce(
        (sum, row) => sum + (row.percentLimit ?? (budgets.sections[row.label]?.percent ?? 0)),
        0
      ),
    [remaining.sections, budgets.sections]
  );

  const entryMaps = useMemo(
    () => ({
      sections: buildEntryMap(remaining.sections),
      themes: buildEntryMap(remaining.themes),
      accounts: buildEntryMap(remaining.accounts),
    }),
    [remaining.sections, remaining.themes, remaining.accounts]
  );

  const handleListAdd = (domain: DomainKey) => {
    const value = listDrafts[domain].trim();
    if (!value) {
      return;
    }

    addListItem(domain, value);
    setListDrafts((prev) => ({ ...prev, [domain]: '' }));
  };

  const handleListRename = (domain: DomainKey, previous: string) =>
    (event: FocusEvent<HTMLInputElement>) => {
      const next = event.target.value.trim();
      if (next && next !== previous) {
        renameListItem(domain, previous, next);
      } else {
        event.target.value = previous;
      }
    };

  const updateDraft = (key: string, partial: Partial<{ amount: string; percent: string }>) => {
    setBudgetDrafts((prev) => ({
      ...prev,
      [key]: {
        amount: partial.amount ?? prev[key]?.amount ?? '',
        percent: partial.percent ?? prev[key]?.percent ?? '',
      },
    }));
  };

  const commitBudget = (domain: DomainKey, label: string, partial: BudgetLimit) => {
    if (domain === 'themes') {
      const existingLimit = budgets.themes[label] ?? {};
      let percentOfSection = partial.percent !== undefined ? partial.percent : existingLimit.percentOfSection;
      let amount = existingLimit.amount;
      let percent = existingLimit.percent;

      const section = portfolio.lists.themeSections?.[label];
      const sectionAmount = section ? getSectionAmount(section) : undefined;
      const sectionPercent = section ? getSectionPercent(section) : undefined;

      if (partial.percent === undefined && partial.amount === undefined) {
        percentOfSection = undefined;
        amount = undefined;
        percent = undefined;
      }

      if (percentOfSection !== undefined) {
        if (sectionAmount !== undefined) {
          amount = (percentOfSection / 100) * sectionAmount;
        } else if (sectionPercent !== undefined && totalValue > 0) {
          const portfolioPercent = (sectionPercent * percentOfSection) / 100;
          amount = (portfolioPercent / 100) * totalValue;
        }

        if (sectionPercent !== undefined) {
          percent = (sectionPercent * percentOfSection) / 100;
        } else if (amount !== undefined && totalValue > 0) {
          percent = (amount / totalValue) * 100;
        } else {
          percent = existingLimit.percent;
        }
      } else if (partial.amount !== undefined) {
        amount = partial.amount;
        percent = totalValue > 0 ? (amount / totalValue) * 100 : existingLimit.percent;
        if (sectionAmount !== undefined && sectionAmount > 0) {
          percentOfSection = (amount / sectionAmount) * 100;
        } else if (sectionPercent !== undefined && totalValue > 0) {
          percentOfSection = (percent / sectionPercent) * 100;
        }
      }

      const next: BudgetLimit = {
        amount,
        percent,
        percentOfSection,
      };

      if (next.amount === undefined && next.percent === undefined && next.percentOfSection === undefined) {
        setBudget('themes', label, undefined);
      } else {
        setBudget('themes', label, next);
      }
      return;
    }

    const existingLimit = budgets[domain]?.[label] ?? {};
    const next: BudgetLimit = {
      amount: partial.amount !== undefined ? partial.amount : existingLimit.amount,
      percent: partial.percent !== undefined ? partial.percent : existingLimit.percent,
    };

    if ((domain === 'sections' || domain === 'accounts') && totalValue > 0) {
      if (partial.amount !== undefined && partial.percent === undefined) {
        next.percent = (partial.amount / totalValue) * 100;
      }
      if (partial.percent !== undefined && partial.amount === undefined) {
        next.amount = (partial.percent / 100) * totalValue;
      }
    }

    if (next.amount === undefined && next.percent === undefined) {
      setBudget(domain, label, undefined);
      return;
    }

    setBudget(domain, label, next);
  };

  const handleDragStart = (domain: DomainKey, index: number) => (event: DragEvent<HTMLDivElement>) => {
    setDragState({ domain, index });
    setDragOver({ domain, index });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${domain}:${index}`);
    }
  };

  const handleDragOver = (domain: DomainKey, index: number) => (event: DragEvent<HTMLDivElement>) => {
    if (!dragState || dragState.domain !== domain) {
      return;
    }
    event.preventDefault();
    if (!dragOver || dragOver.index !== index || dragOver.domain !== domain) {
      setDragOver({ domain, index });
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (domain: DomainKey, index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragState || dragState.domain !== domain) {
      return;
    }

    reorderList(domain, dragState.index, index);
    setDragState(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOver(null);
  };

  const renderDomain = (domain: DomainKey, options: { title: string; hint?: string; meta?: ReactNode }) => {
    const baseList = [...portfolio.lists[domain]];
    const list =
      domain === 'sections'
        ? [...baseList.filter((item) => item !== CASH_SECTION), CASH_SECTION]
        : baseList;
    const entries = entryMaps[domain];
    const canRemove = list.length > 1;

    return (
      <section key={domain} style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <h3 style={cardTitleStyle}>{options.title}</h3>
            {options.hint ? <p style={cardHintStyle}>{options.hint}</p> : null}
          </div>
          {options.meta}
        </div>
        <div>
          {list.map((label, index) => {
            const entry = entries.get(label);
            const key = `${domain}:${label}`;
            const draft = budgetDrafts[key] ?? { amount: '', percent: '' };

            const isDragging = dragState?.domain === domain && dragState.index === index;
            const isDropTarget = dragOver?.domain === domain && dragOver.index === index;
            const title = entry
              ? `${formatCurrency(entry.used)} used · ${entry.percentage.toFixed(2)}%`
              : undefined;
            const isThemeDomain = domain === 'themes';
            const isCashSection = domain === 'sections' && label === CASH_SECTION;
            const isProtected = isCashSection;
            const allowDrag = !isProtected;

            const themePercentOfSection = isThemeDomain ? getThemePercentOfSection(label) : undefined;
            const themePortfolioPercent = isThemeDomain ? getThemePortfolioPercent(label) : undefined;
            const themeAmount = isThemeDomain ? getThemeAmount(label) : undefined;

            const sectionPercentDisplay = isThemeDomain
              ? draft.percent !== ''
                ? draft.percent
                : themePercentOfSection !== undefined
                ? themePercentOfSection.toFixed(2)
                : ''
              : undefined;

            const firstInputValue = isThemeDomain
              ? sectionPercentDisplay
              : isCashSection
              ? sectionRemainder.amount.toFixed(2)
              : draft.amount ?? '';

            const secondInputValue = isThemeDomain
              ? themePortfolioPercent !== undefined
                ? themePortfolioPercent.toFixed(2)
                : ''
              : isCashSection
              ? (totalValue > 0 ? sectionRemainder.percent.toFixed(2) : '0')
              : draft.percent ?? '';

            const amountPlaceholder = isThemeDomain ? '% section' : '£';
            const percentPlaceholder = isThemeDomain ? '% total' : '%';

            return (
              <div
                key={key}
                style={{
                  ...rowStyle,
                  background: isDragging ? '#eff6ff' : isDropTarget ? '#f8fafc' : '#ffffff',
                  boxShadow: isDropTarget ? 'inset 0 0 0 1px #93c5fd' : undefined,
                }}
                draggable={allowDrag}
                onDragStart={allowDrag ? handleDragStart(domain, index) : undefined}
                onDragOver={allowDrag ? handleDragOver(domain, index) : undefined}
                onDrop={allowDrag ? handleDrop(domain, index) : undefined}
                onDragEnd={allowDrag ? handleDragEnd : undefined}
              >
                <span
                  style={{
                    ...dragHandleStyle,
                    cursor: allowDrag ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
                    opacity: allowDrag ? 1 : 0.5,
                  }}
                  aria-hidden="true"
                >
                  ⋮⋮
                </span>
                <input
                  defaultValue={label}
                  onBlur={isProtected ? undefined : handleListRename(domain, label)}
                  style={textInputStyle}
                  title={title}
                  readOnly={isProtected}
                  disabled={isProtected}
                />
                <input
                  type="number"
                  value={firstInputValue}
                  placeholder={amountPlaceholder}
                  step="0.01"
                  style={numberInputStyle}
                  readOnly={isProtected}
                  disabled={isCashSection}
                  tabIndex={isProtected ? -1 : 0}
                  onKeyDown={(event) => {
                    if (
                      !isProtected &&
                      domain === 'accounts' &&
                      event.key === 'Enter' &&
                      event.currentTarget.value.trim() === ''
                    ) {
                      event.preventDefault();
                      const { amount, percent } = computeAccountRemainder(label);
                      const amountString = amount.toFixed(2);
                      const percentString = totalValue > 0 ? percent.toFixed(2) : '';
                      updateDraft(key, {
                        amount: amountString,
                        percent: totalValue > 0 ? percentString : '',
                      });
                      commitBudget('accounts', label, {
                        amount,
                        percent: totalValue > 0 ? percent : undefined,
                      });
                    }
                  }}
                  onChange={(event) => {
                    if (isProtected) {
                      return;
                    }
                    if (isThemeDomain) {
                      updateDraft(key, { percent: event.target.value });
                    } else {
                      updateDraft(key, { amount: event.target.value });
                    }
                  }}
                  onBlur={(event) => {
                    if (isProtected) {
                      return;
                    }
                    if (isThemeDomain) {
                      const parsed = parseNumber(event.target.value);
                      if (parsed === undefined) {
                        updateDraft(key, {
                          percent: '',
                          amount: themeAmount !== undefined ? themeAmount.toFixed(2) : '',
                        });
                        commitBudget('themes', label, { percent: undefined });
                        return;
                      }

                      const section = portfolio.lists.themeSections?.[label];
                      const sectionAmount = section ? getSectionAmount(section) : undefined;
                      const computedAmount = sectionAmount !== undefined ? (parsed / 100) * sectionAmount : undefined;
                      updateDraft(key, {
                        percent: String(parsed),
                        amount: computedAmount !== undefined ? computedAmount.toFixed(2) : '',
                      });
                      commitBudget('themes', label, { percent: parsed });
                      return;
                    }

                    const parsed = parseNumber(event.target.value);
                    if (parsed === undefined) {
                      const reset: Partial<typeof draft> = { amount: '' };
                      if (domain === 'sections' || domain === 'accounts') {
                        reset.percent = '';
                      }
                      updateDraft(key, reset);
                      commitBudget(domain, label, { amount: undefined, percent: undefined });
                      return;
                    }

                    if ((domain === 'sections' || domain === 'accounts') && totalValue > 0) {
                      updateDraft(key, {
                        amount: String(parsed),
                        percent: ((parsed / totalValue) * 100).toFixed(2),
                      });
                    } else {
                      updateDraft(key, { amount: String(parsed) });
                    }

                    commitBudget(domain, label, { amount: parsed });
                  }}
                />
                <input
                  type="number"
                  value={secondInputValue}
                  placeholder={percentPlaceholder}
                  step="0.1"
                  style={numberInputStyle}
                  readOnly={isProtected || isThemeDomain}
                  disabled={isCashSection || isThemeDomain}
                  tabIndex={isProtected || isThemeDomain ? -1 : 0}
                  title={isThemeDomain && themeAmount !== undefined ? `≈ ${formatCurrency(themeAmount)}` : undefined}
                  onChange={(event) => {
                    if (isProtected || isThemeDomain) {
                      return;
                    }
                    updateDraft(key, { percent: event.target.value });
                  }}
                  onBlur={(event) => {
                    if (isProtected || isThemeDomain) {
                      return;
                    }

                    const parsed = parseNumber(event.target.value);
                    if (parsed === undefined) {
                      const reset: Partial<typeof draft> = { percent: '' };
                      if (domain === 'sections' || domain === 'accounts') {
                        reset.amount = '';
                      }
                      updateDraft(key, reset);
                      commitBudget(domain, label, { percent: undefined, amount: undefined });
                      return;
                    }

                    if ((domain === 'sections' || domain === 'accounts') && totalValue > 0) {
                      updateDraft(key, {
                        percent: String(parsed),
                        amount: ((parsed / 100) * totalValue).toFixed(2),
                      });
                    } else {
                      updateDraft(key, { percent: String(parsed) });
                    }

                    commitBudget(domain, label, { percent: parsed });
                  }}
                />
                {domain === 'themes' ? (
                  <select
                    value={portfolio.lists.themeSections?.[label] ?? ''}
                    onChange={(event) =>
                      setThemeSection(label, event.target.value === '' ? undefined : event.target.value)
                    }
                    style={selectStyle}
                    title={undefined}
                  >
                    <option value="">No section</option>
                    {portfolio.lists.sections.map((section) => (
                      <option key={section} value={section} title={section}>
                        {abbreviateSection(section)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span aria-hidden="true" />
                )}
                <button
                  type="button"
                  style={{
                    ...secondaryButtonStyle,
                    width: '2.2rem',
                    padding: '0.35rem 0',
                    fontWeight: 700,
                    textAlign: 'center',
                    opacity: canRemove && !isProtected ? 1 : 0.4,
                    cursor: canRemove && !isProtected ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => canRemove && !isProtected && removeListItem(domain, label)}
                  disabled={!canRemove || isProtected}
                  aria-label={`Remove ${label}`}
                >
                  ×
                </button>
              </div>
            );
          })}
          {dragState && dragState.domain === domain ? (
            <div
              style={{
                ...dropZoneStyle,
                background:
                  dragOver?.domain === domain && dragOver.index === portfolio.lists[domain].length
                    ? '#eff6ff'
                    : '#ffffff',
                borderColor:
                  dragOver?.domain === domain && dragOver.index === portfolio.lists[domain].length
                    ? '#93c5fd'
                    : '#cbd5f5',
              }}
              onDragOver={handleDragOver(domain, portfolio.lists[domain].length)}
              onDrop={handleDrop(domain, portfolio.lists[domain].length)}
              onDragEnd={handleDragEnd}
            >
              Drop here to place at the end
            </div>
          ) : null}
        </div>
        <div style={addRowStyle}>
          <input
            type="text"
            value={listDrafts[domain]}
            onChange={(event) => setListDrafts((prev) => ({ ...prev, [domain]: event.target.value }))}
            placeholder={`Add ${options.title.slice(0, -1)}`}
            style={textInputStyle}
          />
          <button type="button" style={primaryButtonStyle} onClick={() => handleListAdd(domain)}>
            Add
          </button>
        </div>
      </section>
    );
  };

  return (
    <section style={panelStyle}>
      <header style={headerStyle}>
        <h2 style={{ marginBottom: '0.25rem' }}>Portfolio Insights</h2>
        <p style={descriptionStyle}>
          Totals reflect all included holdings (grand total {formatCurrency(totalValue)}).
          {hasFilters ? ' Current grid filters do not change these values.' : ''}
        </p>
        <p
          style={{
            margin: '0.35rem 0 0',
            fontSize: '0.8rem',
            color: totalSectionTarget > 100 ? '#b91c1c' : '#475569',
          }}
        >
          Section target total: {totalSectionTarget.toFixed(2)}%
        </p>
      </header>
      <div style={cardsGridStyle}>
        {renderDomain('sections', {
          title: 'Sections',
          hint: 'Use budgets to keep core and satellite allocations on track.',
          meta: <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>Cash remaining: {formatCurrency(cashRemaining)}</p>,
        })}
        {renderDomain('themes', {
          title: 'Themes',
          hint: 'Assign each theme to a section so targets stay aligned.',
        })}
        {renderDomain('accounts', {
          title: 'Accounts',
          hint: 'Track contributions or limits across your investment accounts.',
        })}
      </div>
    </section>
  );
};

export default InsightsPanel;

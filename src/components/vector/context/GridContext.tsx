import React, { createContext, useContext, useReducer, useCallback } from 'react';

interface GridSettings {
  rows: number;
  cols: number;
  spacing: number;
  margin: number;
}

interface GridState {
  settings: {
    'aspect-ratio': GridSettings;
    manual: GridSettings;
  };
  ratios: Record<string, { ratio: number; label: string }>;
  customRatios: Record<string, { ratio: number; label: string }>;
  lastUpdatedMode: 'aspect-ratio' | 'manual';
}

type GridAction =
  | { type: 'UPDATE_SETTINGS'; mode: keyof GridState['settings']; settings: Partial<GridSettings> }
  | { type: 'ADD_CUSTOM_RATIO'; id: string; ratio: number; label: string }
  | { type: 'SET_LAST_UPDATED_MODE'; mode: GridState['lastUpdatedMode'] };

const initialState: GridState = {
  settings: {
    'aspect-ratio': { rows: 10, cols: 16, spacing: 20, margin: 50 },
    manual: { rows: 10, cols: 10, spacing: 20, margin: 50 }
  },
  ratios: {
    '1:1': { ratio: 1, label: '1:1' },
    '16:9': { ratio: 16/9, label: '16:9' },
    '2:1': { ratio: 2/1, label: '2:1' },
  },
  customRatios: {},
  lastUpdatedMode: 'aspect-ratio'
};

function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.mode]: {
            ...state.settings[action.mode],
            ...action.settings
          }
        }
      };
    case 'ADD_CUSTOM_RATIO':
      return {
        ...state,
        customRatios: {
          ...state.customRatios,
          [action.id]: { ratio: action.ratio, label: action.label }
        }
      };
    case 'SET_LAST_UPDATED_MODE':
      return {
        ...state,
        lastUpdatedMode: action.mode
      };
    default:
      return state;
  }
}

const GridContext = createContext<{
  state: GridState;
  dispatch: React.Dispatch<GridAction>;
}>({ 
  state: initialState,
  dispatch: () => null
});

export const GridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gridReducer, initialState);
  return (
    <GridContext.Provider value={{ state, dispatch }}>
      {children}
    </GridContext.Provider>
  );
};

export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
};

export type { GridSettings, GridState, GridAction };
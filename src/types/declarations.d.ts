/**
 * Module declarations for libraries without TypeScript definitions
 * This helps TypeScript recognize these modules without explicit type definitions
 */

// Declare React modules with proper types
declare module 'react' {
  // React Component types
  export type FC<P = {}> = FunctionComponent<P>;
  export type FunctionComponent<P = {}> = (props: P) => ReactElement | null;
  export type ReactElement = any;
  
  // React Hook types
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useContext<T>(context: Context<T>): T;
  export function useReducer<R extends Reducer<any, any>, I>(
    reducer: R,
    initializerArg: I,
    initializer?: (arg: I) => ReducerState<R>
  ): [ReducerState<R>, Dispatch<ReducerAction<R>>];
  export function useCallback<T extends Function>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any> | undefined): T;
  export function useRef<T = undefined>(initialValue?: T): { current: T };
  export function useLayoutEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useImperativeHandle<T, R extends T>(
    ref: Ref<T>,
    init: () => R,
    deps?: ReadonlyArray<any>
  ): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;
  
  // React event types
  export type SyntheticEvent<T = Element> = {
    target: EventTarget & T;
    currentTarget: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  };
  export type MouseEvent<T = Element> = SyntheticEvent<T> & {
    clientX: number;
    clientY: number;
  };
  export type ChangeEvent<T = Element> = SyntheticEvent<T> & {
    target: EventTarget & T;
  };
  export type FormEvent<T = Element> = SyntheticEvent<T>;
  
  // Additional React types needed
  export type Context<T> = any;
  export type Reducer<S, A> = (prevState: S, action: A) => S;
  export type ReducerState<R extends Reducer<any, any>> = any;
  export type ReducerAction<R extends Reducer<any, any>> = any;
  export type Dispatch<A> = (action: A) => void;
  export type Ref<T> = { current: T | null } | ((instance: T | null) => void);
}

declare module 'react/jsx-runtime';
declare module 'react-dom';
declare module 'react-dom/client';

// Declare React Router modules
declare module 'react-router-dom';

// Declare Material UI modules
declare module '@mui/material';
declare module '@mui/material/*';
declare module '@mui/icons-material/*';
declare module '@mui/material/styles';

// Add any other modules that might be missing type definitions
declare module 'qrcode.react';
declare module '@supabase/supabase-js';

// Extend Window interface to include custom properties
interface Window {
  ENV?: {
    REACT_APP_SUPABASE_URL?: string;
    REACT_APP_SUPABASE_ANON_KEY?: string;
    REACT_APP_TITLE?: string;
    REACT_APP_BASE_URL?: string;
  }
} 
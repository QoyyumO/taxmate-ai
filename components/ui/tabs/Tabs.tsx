'use client';
import React, {
  useState,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
// Use a simple chevron SVG inline
const ChevronRight = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-2"
  >
    <path
      d="M8 6l4 4-4 4"
      stroke="#D1D5DB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface TabsContextType {
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  showTabs: boolean;
  setShowTabs: Dispatch<SetStateAction<boolean>>;
}

export const TabsContext = createContext<TabsContextType>({
  activeStep: 0,
  setActiveStep: () => {},
  showTabs: true,
  setShowTabs: () => {},
});

export function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('useTabs must be used within a TabsContext');
  return ctx;
}

type TabPaneProps = {
  tab?: string;
  children: React.ReactNode;
};

type TabsProps = {
  children: (React.ReactElement<TabPaneProps> | boolean)[];
  showTabs?: boolean;
  justifyTabs?: 'center' | 'left' | 'right';
  tabStyle?: 'progression' | 'independent';
  tabMarginClass?: string;
  onChange?: (activeIndex: number) => void;
};

export default function Tabs({
  children,
  showTabs: showTabsProp = true,
  justifyTabs = 'center',
  tabStyle = 'progression',
  tabMarginClass = 'mt-4 mb-8',
  onChange,
}: TabsProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [showTabs, setShowTabs] = useState(showTabsProp);

  return (
    <TabsContext.Provider
      value={{ activeStep, setActiveStep, showTabs, setShowTabs }}
    >
      <div className="w-full">
        {/* Tabs Row */}
        {showTabs && (
          <div
            className={`flex w-full items-center gap-0 ${tabMarginClass} ${
              justifyTabs === 'left'
                ? 'justify-start'
                : justifyTabs === 'right'
                  ? 'justify-end'
                  : 'justify-center'
            }`}
          >
            {React.Children.map(children, (child, idx) => {
              if (!React.isValidElement(child)) return null;
              const tabTitle = child.props.tab || `step ${idx + 1}`;
              return (
                <React.Fragment key={`step-${idx}`}>
                  <button
                    type="button"
                    className="focus:outline-none"
                    onClick={() => {
                      setActiveStep(idx);
                      onChange?.(idx);
                    }}
                  >
                    {activeStep === idx ? (
                      <span className="border-brand-500 border-b-2 px-2.5 py-2">
                        <span className="text-brand-500 dark:text-brand-400 mr-1 text-sm font-semibold capitalize">
                          {tabTitle}
                        </span>
                      </span>
                    ) : (
                      <span className="text-brand-500 px-3 py-1 text-sm font-normal capitalize dark:text-gray-400">
                        {tabTitle}
                      </span>
                    )}
                  </button>
                  {tabStyle === 'progression' &&
                    idx < React.Children.count(children) - 1 && (
                      <ChevronRight />
                    )}
                </React.Fragment>
              );
            })}
          </div>
        )}
        {/* Step Content */}
        <div className="">{children[activeStep]}</div>
      </div>
    </TabsContext.Provider>
  );
}

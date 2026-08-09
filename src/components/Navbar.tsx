import React from 'react';
import { Home, Shirt, Plus, Compass, User } from 'lucide-react';

export type NavTab = 'home' | 'wardrobe' | 'add' | 'discover' | 'profile';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'wardrobe' as NavTab, label: 'Wardrobe', icon: Shirt },
    { id: 'add' as NavTab, label: 'Add', icon: Plus, isAction: true },
    { id: 'discover' as NavTab, label: 'Discover', icon: Compass },
    { id: 'profile' as NavTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#F5F0E8]/95 backdrop-blur-lg border-t border-[#D8D0C4] px-3 py-2 max-w-md mx-auto sm:max-w-xl">
      <div className="flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onOpenAddModal}
                className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-[#8B1E3F] text-[#F5F0E8] shadow-lg hover:bg-[#721833] active:scale-90 transition-all border-4 border-[#F5F0E8]"
                aria-label="Add outfit or item"
                title="Add Outfit / Item"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#8B1E3F] font-semibold'
                  : 'text-[#777777] hover:text-[#111111]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

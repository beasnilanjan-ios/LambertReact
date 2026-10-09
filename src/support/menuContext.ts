import { createContext, useContext } from 'react';

export interface MenuState {
  openMenu: () => void;
}

export const MenuContext = createContext<MenuState>({
  openMenu: () => console.log('Menu not mounted'),
});

export const useMenu = (): MenuState => useContext(MenuContext);

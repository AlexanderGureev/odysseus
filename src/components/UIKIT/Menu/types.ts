export type MenuProps<T, V> = {
  items: Array<MenuItem<T, V>>;
  selected?: V;
  onSelect?: (item: T) => void;
  closeOnSelect?: boolean;
  onOpen?: () => void;
  onClick?: (item: T) => void;
};

export type SubMenu<T, V> = {
  items: T[];
  selected?: V;
};

export type MenuItem<T, V> = {
  id: string;
  icon?: string;
  title: string;
  value?: V;
  selectedTitle?: string;
  subMenu?: MenuProps<T, V>;
  disabled?: boolean | (() => boolean);
};

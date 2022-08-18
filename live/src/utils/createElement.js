export const createElement = ({ className = '', type = 'div', innerHTML = null, value = null }) => {
  const element = document.createElement(type);
  if (className !== '') {
    element.className = className;
  }

  if (innerHTML) {
    element.innerHTML = innerHTML;
  }

  if (value) {
    element.value = value;
  }

  return element;
};

(() => {
  'use strict';

  const STORAGE_KEY_POSITION = 'gmtoc_position';
  const STORAGE_KEY_MAX_LEVEL = 'gmtoc_max_level';

  const radios = document.querySelectorAll('input[name="position"]');
  const maxLevelSelect = document.getElementById('maxLevel');

  chrome.storage.sync.get(
    { [STORAGE_KEY_POSITION]: 'right', [STORAGE_KEY_MAX_LEVEL]: 4 },
    (result) => {
      const position = result[STORAGE_KEY_POSITION] || 'right';
      radios.forEach((radio) => {
        radio.checked = radio.value === position;
      });

      maxLevelSelect.value = String(result[STORAGE_KEY_MAX_LEVEL] || 4);
    }
  );

  radios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        chrome.storage.sync.set({ [STORAGE_KEY_POSITION]: e.target.value });
      }
    });
  });

  maxLevelSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ [STORAGE_KEY_MAX_LEVEL]: parseInt(maxLevelSelect.value, 10) });
  });
})();

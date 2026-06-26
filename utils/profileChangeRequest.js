const normalizeAddressInput = addressInput => {
  if (!addressInput) {
    return null;
  }

  if (typeof addressInput === 'object') {
    const street = addressInput.street?.trim() || '';
    const city = addressInput.city?.trim() || '';
    const state = addressInput.state?.trim() || '';
    const zipCode = addressInput.zipCode?.trim() || '';
    const country = addressInput.country?.trim() || '';

    if (!street && !city && !state && !zipCode && !country) {
      return null;
    }

    return { street, city, state, zipCode, country };
  }

  if (typeof addressInput === 'string' && addressInput.trim()) {
    return {
      street: addressInput.trim(),
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
  }

  return null;
};

const formatAddress = addressInput => {
  const normalized = normalizeAddressInput(addressInput);
  if (!normalized) {
    return '';
  }

  return [normalized.street, normalized.city, normalized.state, normalized.zipCode, normalized.country]
    .filter(Boolean)
    .join(', ');
};

const phonesEqual = (nextPhone, currentPhone) =>
  String(nextPhone || '').trim() === String(currentPhone || '').trim();

const addressesEqual = (nextAddress, currentAddress) =>
  formatAddress(nextAddress).toLowerCase() === formatAddress(currentAddress).toLowerCase();

module.exports = {
  normalizeAddressInput,
  formatAddress,
  phonesEqual,
  addressesEqual,
};

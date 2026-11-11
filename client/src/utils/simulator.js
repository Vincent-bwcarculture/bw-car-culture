// Config Simulator entry links. The source decides what the user may do:
//   hero / listing → purchase & customise (a car for sale or on display)
//   registered     → customise only (the user's own car)
// Opening the simulator to everyone later only needs canUseSimulator() changed.
export const SIMULATOR_PATH = '/simulator';

export const simulatorUrl = ({ source, modelId, vehicleId, listingId }) => {
  const params = new URLSearchParams({ source });
  if (modelId) params.set('model', modelId);
  if (vehicleId) params.set('vehicle', vehicleId);
  if (listingId) params.set('listing', listingId);
  return `${SIMULATOR_PATH}?${params.toString()}`;
};

export const simulatorMode = source => (source === 'registered' ? 'customize' : 'purchase');

export const canUseSimulator = user => user?.role === 'admin';

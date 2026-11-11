import { findVehicleModel, normalizeVehicle, vehicleDisplayName } from './vehicleModels.js';

const golf = 'vw-golf-8-5-r';

test('matches the Golf 8.5 R however the owner writes it', () => {
  expect(findVehicleModel({ make: 'Volkswagen', model: 'Golf 8.5 R', year: 2025 })?.id).toBe(golf);
  expect(findVehicleModel({ make: 'VW', model: 'golf r', year: 2024 })?.id).toBe(golf);
  expect(findVehicleModel({ make: 'vw', model: 'Golf R 8.5', year: 2023 })?.id).toBe(golf);
  expect(findVehicleModel({ vehicleName: 'VW Golf R', year: 2024 })?.id).toBe(golf);
});

test('does not match other Golfs, older generations or other cars', () => {
  expect(findVehicleModel({ make: 'Volkswagen', model: 'Golf GTI', year: 2025 })).toBeNull();
  expect(findVehicleModel({ make: 'Volkswagen', model: 'Golf R', year: 2017 })).toBeNull();
  expect(findVehicleModel({ vehicleName: 'VW Golf R Mk7.5', year: 2019 })).toBeNull();
  expect(findVehicleModel({ make: 'Toyota', model: 'Hilux', year: 2024 })).toBeNull();
  expect(findVehicleModel({ make: 'Volkswagen', model: 'Polo', year: 2024 })).toBeNull();
  expect(findVehicleModel({})).toBeNull();
});

test('normalises legacy vehicleName entries and builds display names', () => {
  expect(normalizeVehicle({ vehicleName: 'Toyota Land Cruiser 300', year: '2023' }))
    .toEqual({ make: 'toyota', model: 'land cruiser 300', year: 2023 });
  expect(vehicleDisplayName({ make: 'Toyota', model: 'Hilux' })).toBe('Toyota Hilux');
  expect(vehicleDisplayName({ vehicleName: 'My Hilux' })).toBe('My Hilux');
});

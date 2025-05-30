// SavedCarsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const SavedCarsContext = createContext();

export const SavedCarsProvider = ({ children }) => {
  const [savedCars, setSavedCars] = useState(() => {
    const saved = localStorage.getItem('savedCars');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('savedCars', JSON.stringify(savedCars));
  }, [savedCars]);

  const toggleSavedCar = (car) => {
    setSavedCars(prev => {
      const isCarSaved = prev.some(savedCar => savedCar.id === car.id);
      if (isCarSaved) {
        return prev.filter(savedCar => savedCar.id !== car.id);
      }
      return [...prev, car];
    });
  };

  return (
    <SavedCarsContext.Provider value={{ savedCars, toggleSavedCar }}>
      {children}
    </SavedCarsContext.Provider>
  );
};

export const useSavedCars = () => useContext(SavedCarsContext);
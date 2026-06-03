export const PLOT_STATUS_COLORS = {
  available: '#4caf50',
  token: '#ffeb3b',
  booked: '#2196f3',
  halfpayment: '#ff9800',
  sold: '#f44336',
};

export const PLOT_STATUS_LABELS = {
  available: 'Available',
  token: 'Token',
  booked: 'Booked',
  halfpayment: 'Half Payment',
  sold: 'Sold',
};

export const PLOT_STATUS_MUI = {
  available: 'success',
  token: 'warning',
  booked: 'info',
  halfpayment: 'warning',
  sold: 'error',
};

export const AMENITY_TYPES = [
  { id: 'garden', label: 'Garden', emoji: '🌳' },
  { id: 'clubhouse', label: 'Club House', emoji: '🏛️' },
  { id: 'temple', label: 'Temple', emoji: '⛪' },
  { id: 'office', label: 'Office', emoji: '🏢' },
  { id: 'parking', label: 'Parking', emoji: '🅿️' },
  { id: 'watertank', label: 'Water Tank', emoji: '💧' },
  { id: 'entrance', label: 'Entrance Gate', emoji: '🚪' },
];

export const CANVAS_TOOL_TYPES = {
  SELECT: 'select',
  RECTANGLE: 'rectangle',
  POLYGON: 'polygon',
  ROAD: 'road',
  TEXT: 'text',
  AMENITY: 'amenity',
  DELETE: 'delete',
  PAN: 'pan',
};

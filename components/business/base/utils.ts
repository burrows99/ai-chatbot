export const getRandomColor = (): string => {
  const colors = [
    "#6B7280",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#14B8A6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
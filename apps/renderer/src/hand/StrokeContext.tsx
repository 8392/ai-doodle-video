import { createContext, useContext, type ReactNode } from "react";

export type StrokePoint = {
  x: number;
  y: number;
  angle: number;
  visible: boolean;
};

type StrokeContextValue = {
  point: StrokePoint;
  setPoint: (point: StrokePoint) => void;
};

const hiddenPoint: StrokePoint = {
  x: 0,
  y: 0,
  angle: 0,
  visible: false,
};

const StrokeContext = createContext<StrokeContextValue | null>(null);

export function StrokeProvider({
  point,
  setPoint,
  children,
}: {
  point: StrokePoint;
  setPoint: (point: StrokePoint) => void;
  children: ReactNode;
}) {
  return (
    <StrokeContext.Provider value={{ point, setPoint }}>
      {children}
    </StrokeContext.Provider>
  );
}

export function useStrokePoint(): StrokeContextValue {
  const value = useContext(StrokeContext);
  if (!value) {
    throw new Error("useStrokePoint must be used inside StrokeProvider");
  }
  return value;
}

export { hiddenPoint };

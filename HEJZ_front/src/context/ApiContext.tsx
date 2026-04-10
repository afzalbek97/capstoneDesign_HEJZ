import React, { createContext, useContext } from 'react';

/*api url을 하위 컴포넌트에서 자유롭게 쓰게 하기 위해 context로 전달하는 tsx 파일*/


interface ApiContextType {
  apiUrl: string;
  apiKey: string;
}

export const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiContext.Provider');
  }
  return context;
};
'use client'

import { ReactNode, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient, reactQueryDevtools } from './query-client'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(() => queryClient)

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={reactQueryDevtools.initialIsOpen}
          position={reactQueryDevtools.position}
          buttonPosition={reactQueryDevtools.buttonPosition}
        />
      )}
    </QueryClientProvider>
  )
}
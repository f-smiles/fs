'use client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '../server/store/config'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/navbar/index'
import { SessionProvider } from 'next-auth/react'

export default function App({ children }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {/* <Navbar user={user} /> */}
          <Navbar />
          <main>
            {children}
            <Toaster richColors />
          </main>
        </PersistGate>
      </Provider>
    </SessionProvider>
  )
}

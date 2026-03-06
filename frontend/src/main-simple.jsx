import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleApp from './SimpleApp.jsx'
import { AuthWrapper } from './AuthWrapper.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthWrapper>
    {({ user, userRole, handleSignOut }) => (
      <SimpleApp 
        authenticatedUser={user}
        authenticatedUserRole={userRole}
        onSignOut={handleSignOut}
      />
    )}
  </AuthWrapper>
)
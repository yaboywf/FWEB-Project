import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from "./general/UserProvider";

import NotFound from './general/NotFound'
import Layout from './general/Layout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

createRoot(document.body).render(
	<StrictMode>
		<Router>
			<Suspense fallback={<div>Loading...</div>}>
				<UserProvider>
					<div className="error_container"></div>
					<>
						<Routes>
							<Route path="/" element={<LoginPage />} />
							<Route element={<Layout />}>
								<Route path="/explore" element={<ExplorePage />} />
								<Route path="/profile" element={<ProfilePage />} />
							</Route>
							<Route path="*" element={<NotFound />} />
						</Routes>
					</>
				</UserProvider>
			</Suspense>
		</Router>
	</StrictMode>,
);
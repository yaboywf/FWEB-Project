import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from "./general/UserProvider";

import NotFound from './general/NotFound';
import ErrorBoundary from './general/Error';
import Layout from './general/Layout';

const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PendingPage = lazy(() => import('./pages/PendingPage'))
const PairingPage = lazy(() => import('./pages/PairingPage'))
const SessionEditPage = lazy(() => import('./pages/SessionEditPage'))
const SessionCreatePage = lazy(() => import('./pages/SessionCreatePage'))
const ChatBot = lazy(() => import('./pages/ChatBotPage'))

createRoot(document.body).render(
	<StrictMode>
		<Router>
			<UserProvider>
				<Suspense fallback={<ErrorBoundary />}>
					<div className="error_container"></div>
					<>
						<Routes>
							<Route path="/register" element={<RegisterPage />} />
							<Route path="/" element={<LoginPage />} />
							<Route element={<Layout />}>
								<Route path="/explore" element={<ExplorePage />} />
								<Route path="/settings" element={<ProfilePage />} />
								<Route path="/pending" element={<PendingPage />} />
								<Route path="/pairing" element={<PairingPage />} />
								<Route path="/session/edit/:pairId" element={<SessionEditPage />} />
								<Route path="/session/create/:adminNum" element={<SessionCreatePage />} />
								<Route path="/tacklebot" element={<ChatBot />} />
							</Route>
							<Route path="*" element={<NotFound />} />
						</Routes>
					</>
				</Suspense>
			</UserProvider>
		</Router>
	</StrictMode>,
);
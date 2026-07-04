/**
 * App.jsx — intentionally minimal.
 * All routing and layout is handled by router/index.jsx and AppShell.
 * This file exists as a conventional React entry component.
 */

import { AppRouter } from './router/index.jsx'

export default function App() {
  return <AppRouter />
}

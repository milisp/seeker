import './App.css';
import Layout from '@/components/layout';
import { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores';
import { useDevWindowPosition } from '@/hooks';

function App() {
  const { loadWorkspaces } = useWorkspaceStore();
  useDevWindowPosition();

  useEffect(() => {
    loadWorkspaces().catch(e => console.error("failed to load workspaces", e));

  }, [loadWorkspaces])

  return <Layout />;
}
export default App;

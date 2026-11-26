export const nodeNavigation = {
  title: 'nodes.title',
  icon: 'mdi-server-network',
  path: '/nodes',
}

export const nodeRoute = {
  path: nodeNavigation.path,
  name: nodeNavigation.title,
  component: () => import('./components/NodeWorkspace.vue'),
}
